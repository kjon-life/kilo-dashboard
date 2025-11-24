import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { getSystemInfo } from '../utils/system.js';
import { getColimaStatus } from '../utils/colima.js';
import { isDockerRunning, getContainers, getSystemDF, cleanupDryRun } from '../utils/docker.js';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function bar(percent, width = 20) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const color = percent < 60 ? '\x1b[32m' : percent < 85 ? '\x1b[33m' : '\x1b[31m';
    return `${color}${'█'.repeat(filled)}\x1b[90m${'░'.repeat(empty)}\x1b[0m`;
}
export function StatusView() {
    const { exit } = useApp();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        system: null,
        colima: null,
        dockerReady: false,
        containers: [],
        systemDF: null,
        cleanup: null,
    });
    useEffect(() => {
        (async () => {
            const [system, colima, dockerReady] = await Promise.all([
                getSystemInfo(),
                getColimaStatus(),
                isDockerRunning(),
            ]);
            let containers = [];
            let systemDF = null;
            let cleanup = null;
            if (dockerReady) {
                [containers, systemDF, cleanup] = await Promise.all([
                    getContainers(),
                    getSystemDF(),
                    cleanupDryRun(),
                ]);
            }
            setData({ system, colima, dockerReady, containers, systemDF, cleanup });
            setLoading(false);
            // Exit after rendering
            setTimeout(() => exit(), 100);
        })();
    }, [exit]);
    if (loading) {
        return React.createElement(Text, { color: "gray" }, "Loading resource status...");
    }
    const { system, colima, dockerReady, containers, systemDF, cleanup } = data;
    const running = containers.filter(c => c.running).length;
    const stopped = containers.filter(c => !c.running).length;
    const memPercent = system?.memory
        ? (system.memory.used / system.memory.total) * 100
        : 0;
    const diskPercent = system?.disks?.[0]?.percentUsed || 0;
    const totalReclaimable = cleanup
        ? cleanup.images.bytes + cleanup.containers.bytes + cleanup.volumes.bytes + cleanup.buildCache.bytes
        : 0;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Docker Resource Status"),
            React.createElement(Text, { color: "gray" },
                " \u2022 ",
                system?.hostname || 'unknown')),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, null,
                React.createElement(Text, { color: "gray" }, "Colima:     "),
                colima?.running ? (React.createElement(Text, { color: "green" }, "\u25CF running")) : (React.createElement(Text, { color: "red" }, "\u25CB stopped")),
                colima?.running && (React.createElement(Text, { color: "gray" },
                    " (",
                    colima.cpu,
                    " CPU, ",
                    formatBytes(colima.memory),
                    " RAM)"))),
            React.createElement(Box, null,
                React.createElement(Text, { color: "gray" }, "Docker:     "),
                dockerReady ? (React.createElement(Text, { color: "green" }, "\u25CF ready")) : (React.createElement(Text, { color: "red" }, "\u25CB unavailable"))),
            React.createElement(Box, null,
                React.createElement(Text, { color: "gray" }, "Containers: "),
                React.createElement(Text, { color: "cyan" }, running),
                React.createElement(Text, null, " running"),
                stopped > 0 && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { color: "gray" }, ", "),
                    React.createElement(Text, { color: "yellow" }, stopped),
                    React.createElement(Text, null, " stopped"))))),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Resource Usage:"),
            React.createElement(Box, null,
                React.createElement(Box, { width: 12 },
                    React.createElement(Text, null, "  Memory")),
                React.createElement(Text, null, bar(memPercent)),
                React.createElement(Text, null,
                    " ",
                    memPercent.toFixed(0),
                    "%"),
                React.createElement(Text, { color: "gray" },
                    " (",
                    formatBytes(system?.memory?.used || 0),
                    "/",
                    formatBytes(system?.memory?.total || 0),
                    ")")),
            React.createElement(Box, null,
                React.createElement(Box, { width: 12 },
                    React.createElement(Text, null, "  Disk")),
                React.createElement(Text, null, bar(diskPercent)),
                React.createElement(Text, null,
                    " ",
                    diskPercent,
                    "%"),
                React.createElement(Text, { color: "gray" },
                    " (",
                    formatBytes(system?.disks?.[0]?.used || 0),
                    "/",
                    formatBytes(system?.disks?.[0]?.total || 0),
                    ")"))),
        systemDF && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Docker Space:"),
            React.createElement(Box, null,
                React.createElement(Box, { width: 14 },
                    React.createElement(Text, null, "  Images")),
                React.createElement(Text, null, formatBytes(systemDF.images.size)),
                React.createElement(Text, { color: "gray" },
                    " (",
                    systemDF.images.active,
                    "/",
                    systemDF.images.total,
                    " active)")),
            React.createElement(Box, null,
                React.createElement(Box, { width: 14 },
                    React.createElement(Text, null, "  Containers")),
                React.createElement(Text, null, formatBytes(systemDF.containers.size))),
            React.createElement(Box, null,
                React.createElement(Box, { width: 14 },
                    React.createElement(Text, null, "  Volumes")),
                React.createElement(Text, null, formatBytes(systemDF.volumes.size)),
                React.createElement(Text, { color: "gray" },
                    " (",
                    systemDF.volumes.active,
                    "/",
                    systemDF.volumes.total,
                    " in use)")),
            React.createElement(Box, null,
                React.createElement(Box, { width: 14 },
                    React.createElement(Text, null, "  Build Cache")),
                React.createElement(Text, null, formatBytes(systemDF.buildCache.size))))),
        totalReclaimable > 100 * 1024 * 1024 && ( // > 100MB
        React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 1 },
            React.createElement(Text, { bold: true, color: "yellow" }, "\u26A1 Cleanup Available"),
            React.createElement(Text, null,
                "Reclaimable: ",
                React.createElement(Text, { color: "green" }, formatBytes(totalReclaimable))),
            cleanup && cleanup.containers.count > 0 && (React.createElement(Text, { color: "gray" },
                "  \u2022 ",
                cleanup.containers.count,
                " stopped containers (",
                formatBytes(cleanup.containers.bytes),
                ")")),
            cleanup && cleanup.images.count > 0 && (React.createElement(Text, { color: "gray" },
                "  \u2022 ",
                cleanup.images.count,
                " dangling images (",
                formatBytes(cleanup.images.bytes),
                ")")),
            cleanup && cleanup.volumes.count > 0 && (React.createElement(Text, { color: "gray" },
                "  \u2022 ",
                cleanup.volumes.count,
                " unused volumes (",
                formatBytes(cleanup.volumes.bytes),
                ")")),
            cleanup && cleanup.buildCache.bytes > 0 && (React.createElement(Text, { color: "gray" },
                "  \u2022 Build cache (",
                formatBytes(cleanup.buildCache.bytes),
                ")")),
            React.createElement(Text, { color: "cyan" }, "Run: dm clean")))));
}
