import { runCommand, runCommandSync, parseBytes, formatBytes } from './exec.js';

export interface ColimaStatus {
  running: boolean;
  cpu: number;
  memory: number;  // bytes allocated
  disk: number;    // bytes allocated
  runtime: string;
  arch: string;
  vmType: string;
  mountType: string;
  socketPath: string;
}

export interface ColimaVMStats {
  cpuUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
}

export interface ColimaDataDisk {
  usedBytes: number;
  totalBytes: number;
  availableBytes: number;
  usedPercent: number;
  mountPoint: string;
}

export async function getColimaStatus(): Promise<ColimaStatus | null> {
  const result = await runCommand('colima status --json 2>/dev/null');
  
  if (!result.success || !result.stdout) {
    return null;
  }
  
  try {
    const status = JSON.parse(result.stdout);
    return {
      running: status.status === 'Running',
      cpu: status.cpu || 0,
      memory: (status.memory || 0) * 1024 * 1024 * 1024, // GB to bytes
      disk: (status.disk || 0) * 1024 * 1024 * 1024,     // GB to bytes
      runtime: status.runtime || 'docker',
      arch: status.arch || 'unknown',
      vmType: status.vm_type || 'unknown',
      mountType: status.mount_type || 'unknown',
      socketPath: status.docker_socket || '',
    };
  } catch {
    return null;
  }
}

export async function getColimaVMStats(): Promise<ColimaVMStats | null> {
  // Get Colima VM resource usage via Lima
  // Lima stores state in ~/.lima/colima/
  
  const status = await getColimaStatus();
  if (!status || !status.running) {
    return null;
  }
  
  // Get actual VM disk usage
  const diskResult = await runCommand(
    `colima ssh -- df -B1 / 2>/dev/null | tail -1 | awk '{print $2, $3}'`
  );
  
  let diskTotal = status.disk;
  let diskUsed = 0;
  
  if (diskResult.success && diskResult.stdout) {
    const [total, used] = diskResult.stdout.split(/\s+/);
    diskTotal = parseInt(total) || status.disk;
    diskUsed = parseInt(used) || 0;
  }
  
  // Get VM memory usage
  const memResult = await runCommand(
    `colima ssh -- free -b 2>/dev/null | grep Mem | awk '{print $2, $3}'`
  );
  
  let memTotal = status.memory;
  let memUsed = 0;
  
  if (memResult.success && memResult.stdout) {
    const [total, used] = memResult.stdout.split(/\s+/);
    memTotal = parseInt(total) || status.memory;
    memUsed = parseInt(used) || 0;
  }
  
  // Get CPU usage
  const cpuResult = await runCommand(
    `colima ssh -- top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}'`
  );
  
  let cpuPercent = 0;
  if (cpuResult.success && cpuResult.stdout) {
    cpuPercent = parseFloat(cpuResult.stdout) || 0;
  }
  
  return {
    cpuUsagePercent: cpuPercent,
    memoryUsedBytes: memUsed,
    memoryTotalBytes: memTotal,
    diskUsedBytes: diskUsed,
    diskTotalBytes: diskTotal,
  };
}

export function getColimaStatusSync(): ColimaStatus | null {
  try {
    const stdout = runCommandSync('colima status --json 2>/dev/null');
    if (!stdout) return null;

    const status = JSON.parse(stdout);
    return {
      running: status.status === 'Running',
      cpu: status.cpu || 0,
      memory: (status.memory || 0) * 1024 * 1024 * 1024,
      disk: (status.disk || 0) * 1024 * 1024 * 1024,
      runtime: status.runtime || 'docker',
      arch: status.arch || 'unknown',
      vmType: status.vm_type || 'unknown',
      mountType: status.mount_type || 'unknown',
      socketPath: status.docker_socket || '',
    };
  } catch {
    return null;
  }
}

/**
 * Get Colima VM data disk usage (/mnt/lima-colima)
 * This is where Docker images, containers, and volumes are actually stored
 */
export async function getColimaDataDisk(): Promise<ColimaDataDisk | null> {
  const status = await getColimaStatus();
  if (!status || !status.running) {
    return null;
  }

  // Check the data disk where Docker stores everything
  // On Colima with QEMU, this is /dev/vdb1 mounted at /mnt/lima-colima
  // On Colima with VZ, this might be /dev/vda1 or similar
  const diskResult = await runCommand(
    `colima ssh -- df -B1 /mnt/lima-colima 2>/dev/null || colima ssh -- df -B1 / 2>/dev/null | tail -1`
  );

  if (!diskResult.success || !diskResult.stdout) {
    return null;
  }

  // Parse df output: Filesystem 1B-blocks Used Available Use% Mounted on
  const lines = diskResult.stdout.trim().split('\n');
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(/\s+/);

  if (parts.length < 6) {
    return null;
  }

  // Extract values (format: filesystem total used avail percent mountpoint)
  const totalBytes = parseInt(parts[1]) || 0;
  const usedBytes = parseInt(parts[2]) || 0;
  const availableBytes = parseInt(parts[3]) || 0;
  const percentStr = parts[4] || '0%';
  const usedPercent = parseInt(percentStr.replace('%', '')) || 0;
  const mountPoint = parts[5] || '/';

  return {
    usedBytes,
    totalBytes,
    availableBytes,
    usedPercent,
    mountPoint,
  };
}
