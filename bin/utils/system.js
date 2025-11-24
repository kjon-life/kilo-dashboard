import { runCommand, parseBytes } from './exec.js';
export async function getMemoryStats() {
    // Get page size
    const pageSizeResult = await runCommand('pagesize');
    const pageSize = parseInt(pageSizeResult.stdout) || 16384; // M-series default
    // Get VM stats
    const vmResult = await runCommand('vm_stat');
    if (!vmResult.success)
        return null;
    const stats = {};
    for (const line of vmResult.stdout.split('\n')) {
        const match = line.match(/^(.+?):\s+([\d.]+)/);
        if (match) {
            stats[match[1].trim()] = parseInt(match[2]) * pageSize;
        }
    }
    // Get total physical memory
    const memResult = await runCommand('sysctl -n hw.memsize');
    const total = parseInt(memResult.stdout) || 0;
    // Get swap info
    const swapResult = await runCommand('sysctl -n vm.swapusage');
    let swapUsed = 0;
    let swapTotal = 0;
    if (swapResult.success) {
        const usedMatch = swapResult.stdout.match(/used\s*=\s*([\d.]+\s*\w)/);
        const totalMatch = swapResult.stdout.match(/total\s*=\s*([\d.]+\s*\w)/);
        swapUsed = usedMatch ? parseBytes(usedMatch[1] + 'B') : 0;
        swapTotal = totalMatch ? parseBytes(totalMatch[1] + 'B') : 0;
    }
    const wired = stats['Pages wired down'] || 0;
    const compressed = stats['Pages occupied by compressor'] || 0;
    const free = stats['Pages free'] || 0;
    const active = stats['Pages active'] || 0;
    const inactive = stats['Pages inactive'] || 0;
    const speculative = stats['Pages speculative'] || 0;
    const cached = stats['File-backed pages'] || 0;
    const used = total - free - inactive - speculative;
    const app = active;
    return {
        total,
        used,
        free: free + inactive + speculative,
        wired,
        compressed,
        cached,
        app,
        swapUsed,
        swapTotal,
    };
}
export async function getDiskStats() {
    const result = await runCommand("df -H | grep -E '^/dev/' | awk '{print $1, $2, $3, $4, $5, $9}'");
    if (!result.success || !result.stdout) {
        return [];
    }
    const disks = [];
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        const parts = line.split(/\s+/);
        if (parts.length < 6)
            continue;
        const [filesystem, totalStr, usedStr, availStr, percentStr, mountPoint] = parts;
        disks.push({
            filesystem,
            total: parseBytes(totalStr + (totalStr.match(/[A-Za-z]$/) ? '' : 'B')),
            used: parseBytes(usedStr + (usedStr.match(/[A-Za-z]$/) ? '' : 'B')),
            available: parseBytes(availStr + (availStr.match(/[A-Za-z]$/) ? '' : 'B')),
            mountPoint,
            percentUsed: parseInt(percentStr) || 0,
        });
    }
    return disks;
}
export async function getSystemInfo() {
    const [hostname, model, chip, cores, memory, disks, uptime] = await Promise.all([
        runCommand('hostname -s').then(r => r.stdout || 'unknown'),
        runCommand('sysctl -n hw.model').then(r => r.stdout || 'unknown'),
        runCommand('sysctl -n machdep.cpu.brand_string').then(r => r.stdout || 'Apple Silicon'),
        runCommand('sysctl -n hw.ncpu').then(r => parseInt(r.stdout) || 0),
        getMemoryStats(),
        getDiskStats(),
        runCommand("uptime | sed 's/.*up //' | sed 's/,.*//'").then(r => r.stdout || 'unknown'),
    ]);
    if (!memory)
        return null;
    return {
        hostname,
        model,
        chip,
        cores,
        memory,
        disks,
        uptime,
    };
}
