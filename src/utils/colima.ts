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
