import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Header } from './Header.js';
import { ResourceBar } from './ResourceBar.js';
import { getSystemInfo } from '../utils/system.js';
import { getColimaStatus, getColimaVMStats } from '../utils/colima.js';
import { isDockerRunning, getContainers, getContainerStats, getSystemDF } from '../utils/docker.js';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function Dashboard() {
    const { exit } = useApp();
    const [state, setState] = useState({
        loading: true,
        system: null,
        colima: null,
        colimaVM: null,
        dockerReady: false,
        containers: [],
        systemDF: null,
        lastUpdate: new Date(),
    });
    const refresh = async () => {
        setState(s => ({ ...s, loading: true }));
        const [system, colima, dockerReady] = await Promise.all([
            getSystemInfo(),
            getColimaStatus(),
            isDockerRunning(),
        ]);
        let colimaVM = null;
        let containers = [];
        let systemDF = null;
        if (colima?.running) {
            colimaVM = await getColimaVMStats();
        }
        if (dockerReady) {
            [containers, systemDF] = await Promise.all([
                getContainers(),
                getSystemDF(),
            ]);
            // Enrich with stats for running containers
            const stats = await getContainerStats();
            containers = containers.map(c => ({
                ...c,
                ...stats.get(c.id),
            }));
        }
        setState({
            loading: false,
            system,
            colima,
            colimaVM,
            dockerReady,
            containers,
            systemDF,
            lastUpdate: new Date(),
        });
    };
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);
    useInput((input) => {
        if (input === 'q')
            exit();
        if (input === 'r')
            refresh();
    });
    const { system, colima, colimaVM, dockerReady, containers, systemDF, loading, lastUpdate } = state;
    const runningContainers = containers.filter(c => c.running);
    const stoppedContainers = containers.filter(c => !c.running);
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Header, { hostname: system?.hostname || 'loading...', chip: system?.chip || '', uptime: system?.uptime || '', colimaRunning: colima?.running || false, dockerRunning: dockerReady }),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" }, "\u250C\u2500 macOS System \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
            system?.memory && (React.createElement(React.Fragment, null,
                React.createElement(ResourceBar, { label: "  Memory", used: system.memory.used, total: system.memory.total }),
                React.createElement(ResourceBar, { label: "  Swap", used: system.memory.swapUsed, total: system.memory.swapTotal || system.memory.swapUsed + 1 }))),
            system?.disks?.[0] && (React.createElement(ResourceBar, { label: "  Disk", used: system.disks[0].used, total: system.disks[0].total }))),
        colima?.running && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" }, "\u250C\u2500 Colima VM \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
            React.createElement(Box, { paddingLeft: 2 },
                React.createElement(Text, { color: "gray" },
                    colima.cpu,
                    " CPUs \u2022 ",
                    formatBytes(colima.memory),
                    " RAM \u2022 ",
                    formatBytes(colima.disk),
                    " disk \u2022 ",
                    colima.vmType)),
            colimaVM && (React.createElement(React.Fragment, null,
                React.createElement(ResourceBar, { label: "  VM Memory", used: colimaVM.memoryUsedBytes, total: colimaVM.memoryTotalBytes }),
                React.createElement(ResourceBar, { label: "  VM Disk", used: colimaVM.diskUsedBytes, total: colimaVM.diskTotalBytes }))))),
        dockerReady && systemDF && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" }, "\u250C\u2500 Docker Resources \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
            React.createElement(Box, { paddingLeft: 2, flexDirection: "column" },
                React.createElement(Box, null,
                    React.createElement(Box, { width: 20 },
                        React.createElement(Text, null, "Images:")),
                    React.createElement(Text, { color: "cyan" },
                        systemDF.images.active,
                        "/",
                        systemDF.images.total),
                    React.createElement(Text, { color: "gray" }, " active \u2022 "),
                    React.createElement(Text, null, formatBytes(systemDF.images.size)),
                    React.createElement(Text, { color: "green" },
                        " (",
                        formatBytes(systemDF.images.reclaimable),
                        " reclaimable)")),
                React.createElement(Box, null,
                    React.createElement(Box, { width: 20 },
                        React.createElement(Text, null, "Containers:")),
                    React.createElement(Text, { color: "cyan" },
                        runningContainers.length,
                        "/",
                        containers.length),
                    React.createElement(Text, { color: "gray" }, " running \u2022 "),
                    React.createElement(Text, null, formatBytes(systemDF.containers.size))),
                React.createElement(Box, null,
                    React.createElement(Box, { width: 20 },
                        React.createElement(Text, null, "Volumes:")),
                    React.createElement(Text, { color: "cyan" },
                        systemDF.volumes.active,
                        "/",
                        systemDF.volumes.total),
                    React.createElement(Text, { color: "gray" }, " in use \u2022 "),
                    React.createElement(Text, null, formatBytes(systemDF.volumes.size)),
                    React.createElement(Text, { color: "green" },
                        " (",
                        formatBytes(systemDF.volumes.reclaimable),
                        " reclaimable)")),
                React.createElement(Box, null,
                    React.createElement(Box, { width: 20 },
                        React.createElement(Text, null, "Build Cache:")),
                    React.createElement(Text, null, formatBytes(systemDF.buildCache.size)),
                    React.createElement(Text, { color: "green" },
                        " (",
                        formatBytes(systemDF.buildCache.reclaimable),
                        " reclaimable)"))))),
        runningContainers.length > 0 && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" }, "\u250C\u2500 Running Containers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
            runningContainers.slice(0, 5).map((c) => (React.createElement(Box, { key: c.id, paddingLeft: 2 },
                React.createElement(Box, { width: 35 },
                    React.createElement(Text, { color: "green" }, "\u25CF "),
                    React.createElement(Text, null, c.name.substring(0, 32))),
                React.createElement(Box, { width: 15 },
                    React.createElement(Text, { color: "gray" }, "CPU: "),
                    React.createElement(Text, { color: c.cpuPercent && c.cpuPercent > 50 ? 'yellow' : 'white' },
                        c.cpuPercent?.toFixed(1) || '0',
                        "%")),
                React.createElement(Box, { width: 20 },
                    React.createElement(Text, { color: "gray" }, "MEM: "),
                    React.createElement(Text, null, formatBytes(c.memUsage || 0)))))),
            runningContainers.length > 5 && (React.createElement(Box, { paddingLeft: 2 },
                React.createElement(Text, { color: "gray" },
                    "  ... and ",
                    runningContainers.length - 5,
                    " more"))))),
        stoppedContainers.length > 0 && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white" },
                "\u250C\u2500 Stopped Containers (",
                stoppedContainers.length,
                ") \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510"),
            stoppedContainers.slice(0, 3).map((c) => (React.createElement(Box, { key: c.id, paddingLeft: 2 },
                React.createElement(Text, { color: "gray" }, "\u25CB "),
                React.createElement(Box, { width: 35 },
                    React.createElement(Text, { color: "gray" }, c.name.substring(0, 32))),
                React.createElement(Text, { color: "gray" }, c.status)))),
            stoppedContainers.length > 3 && (React.createElement(Box, { paddingLeft: 2 },
                React.createElement(Text, { color: "gray" },
                    "  ... and ",
                    stoppedContainers.length - 3,
                    " more"))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "gray" },
                "Last updated: ",
                lastUpdate.toLocaleTimeString(),
                " \u2022 Press 'r' to refresh \u2022 'q' to quit",
                loading && ' • refreshing...'))));
}
