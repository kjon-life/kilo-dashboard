export interface ColimaStatus {
    running: boolean;
    cpu: number;
    memory: number;
    disk: number;
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
export declare function getColimaStatus(): Promise<ColimaStatus | null>;
export declare function getColimaVMStats(): Promise<ColimaVMStats | null>;
export declare function getColimaStatusSync(): ColimaStatus | null;
/**
 * Get Colima VM data disk usage (/mnt/lima-colima)
 * This is where Docker images, containers, and volumes are actually stored
 */
export declare function getColimaDataDisk(): Promise<ColimaDataDisk | null>;
