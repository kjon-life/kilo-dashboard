import { runCommand, parseBytes } from './exec.js';
export async function isDockerRunning() {
    const result = await runCommand('docker info >/dev/null 2>&1');
    return result.success;
}
export async function getContainers() {
    const format = '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.CreatedAt}}|{{.Size}}';
    const result = await runCommand(`docker ps -a --format "${format}" --no-trunc`);
    if (!result.success || !result.stdout) {
        return [];
    }
    const containers = [];
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        const [id, name, image, status, state, created, sizeStr] = line.split('|');
        // Parse size like "15.1MB (virtual 3.54GB)"
        const sizeMatch = sizeStr?.match(/([\d.]+\s*\w+)\s*\(virtual\s*([\d.]+\s*\w+)\)/);
        const size = sizeMatch ? parseBytes(sizeMatch[1]) : 0;
        const virtualSize = sizeMatch ? parseBytes(sizeMatch[2]) : 0;
        containers.push({
            id: id.substring(0, 12),
            name,
            image,
            status,
            running: state === 'running',
            created,
            size,
            virtualSize,
        });
    }
    return containers;
}
export async function getContainerStats() {
    const format = '{{.ID}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}';
    const result = await runCommand(`docker stats --no-stream --format "${format}"`);
    const stats = new Map();
    if (!result.success || !result.stdout) {
        return stats;
    }
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        const [id, cpu, memUsage, memPercent, netIO, blockIO] = line.split('|');
        // Parse "123.4MiB / 7.656GiB"
        const memMatch = memUsage?.match(/([\d.]+\s*\w+)\s*\/\s*([\d.]+\s*\w+)/);
        const [memUsed, memLimit] = memMatch
            ? [parseBytes(memMatch[1]), parseBytes(memMatch[2])]
            : [0, 0];
        // Parse "1.5MB / 2.3MB"
        const netMatch = netIO?.match(/([\d.]+\s*\w+)\s*\/\s*([\d.]+\s*\w+)/);
        const [netRx, netTx] = netMatch
            ? [parseBytes(netMatch[1]), parseBytes(netMatch[2])]
            : [0, 0];
        // Parse "10MB / 5MB"
        const blockMatch = blockIO?.match(/([\d.]+\s*\w+)\s*\/\s*([\d.]+\s*\w+)/);
        const [blockRead, blockWrite] = blockMatch
            ? [parseBytes(blockMatch[1]), parseBytes(blockMatch[2])]
            : [0, 0];
        stats.set(id.substring(0, 12), {
            cpuPercent: parseFloat(cpu) || 0,
            memUsage: memUsed,
            memLimit: memLimit,
            memPercent: parseFloat(memPercent) || 0,
            netIO: { rx: netRx, tx: netTx },
            blockIO: { read: blockRead, write: blockWrite },
        });
    }
    return stats;
}
export async function getImages() {
    const format = '{{.ID}}|{{.Repository}}|{{.Tag}}|{{.CreatedAt}}|{{.Size}}';
    const result = await runCommand(`docker images --format "${format}" --no-trunc`);
    if (!result.success || !result.stdout) {
        return [];
    }
    // Get images in use by containers
    const containerResult = await runCommand(`docker ps -a --format "{{.Image}}"`);
    const usedImages = new Set(containerResult.stdout?.split('\n').filter(Boolean) || []);
    const images = [];
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        const [id, repository, tag, created, sizeStr] = line.split('|');
        const fullName = `${repository}:${tag}`;
        images.push({
            id: id.substring(0, 12),
            repository,
            tag,
            created,
            size: parseBytes(sizeStr),
            inUse: usedImages.has(fullName) || usedImages.has(id) || usedImages.has(id.substring(0, 12)),
        });
    }
    return images;
}
export async function getVolumes() {
    const result = await runCommand('docker volume ls --format "{{.Name}}|{{.Driver}}"');
    if (!result.success || !result.stdout) {
        return [];
    }
    // Get volume usage from containers
    const containerVolumes = await runCommand(`docker ps -a --format '{{.Mounts}}' | tr ',' '\n' | sort | uniq -c`);
    const volumeUsage = new Map();
    if (containerVolumes.success && containerVolumes.stdout) {
        for (const line of containerVolumes.stdout.split('\n')) {
            const match = line.trim().match(/^(\d+)\s+(.+)/);
            if (match) {
                volumeUsage.set(match[2], parseInt(match[1]));
            }
        }
    }
    const volumes = [];
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        const [name, driver] = line.split('|');
        // Get volume details
        const inspectResult = await runCommand(`docker volume inspect ${name} --format "{{.Mountpoint}}"`);
        const mountpoint = inspectResult.success ? inspectResult.stdout : '';
        // Get volume size (requires inspecting the actual filesystem in the VM)
        let size = 0;
        const sizeResult = await runCommand(`docker run --rm -v ${name}:/vol alpine du -sb /vol 2>/dev/null | cut -f1`);
        if (sizeResult.success && sizeResult.stdout) {
            size = parseInt(sizeResult.stdout) || 0;
        }
        const containerCount = volumeUsage.get(name) || 0;
        volumes.push({
            name,
            driver,
            mountpoint,
            size,
            inUse: containerCount > 0,
            containerCount,
        });
    }
    return volumes;
}
export async function getSystemDF() {
    const result = await runCommand('docker system df --format "{{json .}}"');
    if (!result.success || !result.stdout) {
        return null;
    }
    const df = {
        images: { total: 0, active: 0, size: 0, reclaimable: 0 },
        containers: { total: 0, active: 0, size: 0, reclaimable: 0 },
        volumes: { total: 0, active: 0, size: 0, reclaimable: 0 },
        buildCache: { total: 0, active: 0, size: 0, reclaimable: 0 },
    };
    for (const line of result.stdout.split('\n')) {
        if (!line.trim())
            continue;
        try {
            const item = JSON.parse(line);
            const target = item.Type === 'Images' ? df.images
                : item.Type === 'Containers' ? df.containers
                    : item.Type === 'Local Volumes' ? df.volumes
                        : item.Type === 'Build Cache' ? df.buildCache
                            : null;
            if (target) {
                target.total = item.TotalCount || 0;
                target.active = item.Active || 0;
                target.size = parseBytes(item.Size || '0');
                target.reclaimable = parseBytes(item.Reclaimable?.replace(/\s*\([^)]+\)/, '') || '0');
            }
        }
        catch {
            // Skip malformed lines
        }
    }
    return df;
}
export async function cleanupDryRun() {
    const stats = {
        images: { count: 0, bytes: 0 },
        containers: { count: 0, bytes: 0 },
        volumes: { count: 0, bytes: 0 },
        buildCache: { bytes: 0 },
    };
    // Stopped containers
    const containers = await getContainers();
    for (const c of containers) {
        if (!c.running) {
            stats.containers.count++;
            stats.containers.bytes += c.size;
        }
    }
    // Dangling images
    const danglingResult = await runCommand('docker images -f "dangling=true" -q');
    if (danglingResult.success && danglingResult.stdout) {
        const ids = danglingResult.stdout.split('\n').filter(Boolean);
        stats.images.count = ids.length;
        for (const id of ids.slice(0, 10)) { // Sample first 10
            const sizeResult = await runCommand(`docker image inspect ${id} --format "{{.Size}}"`);
            if (sizeResult.success) {
                stats.images.bytes += parseInt(sizeResult.stdout) || 0;
            }
        }
        if (ids.length > 10) {
            stats.images.bytes = Math.round(stats.images.bytes * (ids.length / 10));
        }
    }
    // Unused volumes
    const volumes = await getVolumes();
    for (const v of volumes) {
        if (!v.inUse) {
            stats.volumes.count++;
            stats.volumes.bytes += v.size;
        }
    }
    // Build cache
    const df = await getSystemDF();
    if (df) {
        stats.buildCache.bytes = df.buildCache.reclaimable;
    }
    return stats;
}
export async function cleanup(targets) {
    let reclaimed = 0;
    if (targets.containers) {
        await runCommand('docker container prune -f');
    }
    if (targets.images) {
        await runCommand('docker image prune -f');
    }
    if (targets.volumes) {
        await runCommand('docker volume prune -f');
    }
    if (targets.buildCache) {
        const result = await runCommand('docker builder prune -f');
        const match = result.stdout?.match(/Total reclaimed space:\s*([\d.]+\s*\w+)/);
        if (match) {
            reclaimed += parseBytes(match[1]);
        }
    }
    return { success: true, reclaimed };
}
/**
 * Get Sculptor-specific images (sculptor-prj_*-snapshot)
 * These are snapshot images created by the Sculptor AI coding agent
 */
export async function getSculptorImages() {
    const allImages = await getImages();
    const sculptorImages = [];
    for (const image of allImages) {
        // Match sculptor-prj_*-snapshot pattern
        const match = image.repository.match(/^sculptor-prj_(.+)-snapshot$/);
        if (!match)
            continue;
        const projectName = match[1];
        // Parse created date - Docker format is like "2024-11-24 20:53:15 -0800 PST"
        let createdDate = new Date();
        let ageInDays = 0;
        try {
            // Try to parse the created string
            createdDate = new Date(image.created);
            if (!isNaN(createdDate.getTime())) {
                const now = new Date();
                ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }
        catch {
            // If parsing fails, use current date and 0 age
        }
        sculptorImages.push({
            ...image,
            projectName,
            ageInDays,
            createdTimestamp: createdDate,
        });
    }
    // Sort by age (oldest first)
    sculptorImages.sort((a, b) => b.ageInDays - a.ageInDays);
    return sculptorImages;
}
/**
 * Clean up Sculptor images older than specified days
 */
export async function cleanupSculptorImages(olderThanDays) {
    const sculptorImages = await getSculptorImages();
    const toRemove = sculptorImages.filter(img => img.ageInDays > olderThanDays && !img.inUse);
    let removed = 0;
    let reclaimed = 0;
    for (const image of toRemove) {
        const result = await runCommand(`docker image rm ${image.id} -f 2>/dev/null`);
        if (result.success) {
            removed++;
            reclaimed += image.size;
        }
    }
    return { success: true, removed, reclaimed };
}
