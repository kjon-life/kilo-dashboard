import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export async function runCommand(cmd: string): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { 
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000 
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
  } catch (error: any) {
    return { 
      stdout: error.stdout?.trim() || '', 
      stderr: error.stderr?.trim() || error.message, 
      success: false 
    };
  }
}

export function runCommandSync(cmd: string): string {
  try {
    return execSync(cmd, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000 
    }).trim();
  } catch {
    return '';
  }
}

export function parseBytes(str: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 ** 2,
    'GB': 1024 ** 3,
    'TB': 1024 ** 4,
    'KiB': 1024,
    'MiB': 1024 ** 2,
    'GiB': 1024 ** 3,
    'TiB': 1024 ** 4,
  };
  
  const match = str.match(/^([\d.]+)\s*([A-Za-z]+)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || 'B';
  
  return value * (units[unit] || 1);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function colorByPercent(percent: number): 'green' | 'yellow' | 'red' {
  if (percent < 60) return 'green';
  if (percent < 85) return 'yellow';
  return 'red';
}
