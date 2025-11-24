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
export declare function getColimaStatus(): Promise<ColimaStatus | null>;
export declare function getColimaVMStats(): Promise<ColimaVMStats | null>;
export declare function getColimaStatusSync(): ColimaStatus | null;
