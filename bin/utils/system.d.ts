export interface MacOSMemory {
    total: number;
    used: number;
    free: number;
    wired: number;
    compressed: number;
    cached: number;
    app: number;
    swapUsed: number;
    swapTotal: number;
}
export interface MacOSDisk {
    filesystem: string;
    total: number;
    used: number;
    available: number;
    mountPoint: string;
    percentUsed: number;
}
export interface MacOSSystem {
    hostname: string;
    model: string;
    chip: string;
    cores: number;
    memory: MacOSMemory;
    disks: MacOSDisk[];
    uptime: string;
}
export declare function getMemoryStats(): Promise<MacOSMemory | null>;
export declare function getDiskStats(): Promise<MacOSDisk[]>;
export declare function getSystemInfo(): Promise<MacOSSystem | null>;
