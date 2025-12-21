export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    running: boolean;
    created: string;
    size: number;
    virtualSize: number;
    cpuPercent?: number;
    memUsage?: number;
    memLimit?: number;
    memPercent?: number;
    netIO?: {
        rx: number;
        tx: number;
    };
    blockIO?: {
        read: number;
        write: number;
    };
}
export interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    created: string;
    size: number;
    inUse: boolean;
}
export interface SculptorImage extends DockerImage {
    projectName: string;
    ageInDays: number;
    createdTimestamp: Date;
}
export interface DockerVolume {
    name: string;
    driver: string;
    mountpoint: string;
    size: number;
    inUse: boolean;
    containerCount: number;
}
export interface DockerSystemDF {
    images: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
    containers: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
    volumes: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
    buildCache: {
        total: number;
        active: number;
        size: number;
        reclaimable: number;
    };
}
export declare function isDockerRunning(): Promise<boolean>;
export declare function getContainers(): Promise<DockerContainer[]>;
export declare function getContainerStats(): Promise<Map<string, Partial<DockerContainer>>>;
export declare function getImages(): Promise<DockerImage[]>;
export declare function getVolumes(): Promise<DockerVolume[]>;
export declare function getSystemDF(): Promise<DockerSystemDF | null>;
export interface CleanupStats {
    images: {
        count: number;
        bytes: number;
    };
    containers: {
        count: number;
        bytes: number;
    };
    volumes: {
        count: number;
        bytes: number;
    };
    buildCache: {
        bytes: number;
    };
}
export declare function cleanupDryRun(): Promise<CleanupStats>;
export declare function cleanup(targets: {
    containers?: boolean;
    images?: boolean;
    volumes?: boolean;
    buildCache?: boolean;
}): Promise<{
    success: boolean;
    reclaimed: number;
}>;
/**
 * Get Sculptor-specific images (sculptor-prj_*-snapshot)
 * These are snapshot images created by the Sculptor AI coding agent
 */
export declare function getSculptorImages(): Promise<SculptorImage[]>;
/**
 * Clean up Sculptor images older than specified days
 */
export declare function cleanupSculptorImages(olderThanDays: number): Promise<{
    success: boolean;
    removed: number;
    reclaimed: number;
}>;
