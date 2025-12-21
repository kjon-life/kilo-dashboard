import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getColimaStatus, getColimaVMStats, getColimaDataDisk } from '../utils/colima.js';
import { formatBytes } from '../utils/exec.js';
import { ResourceBar } from './ResourceBar.js';
export function ColimaView() {
    const [status, setStatus] = useState(null);
    const [vmStats, setVMStats] = useState(null);
    const [dataDisk, setDataDisk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            try {
                const [statusData, vmStatsData, dataDiskData] = await Promise.all([
                    getColimaStatus(),
                    getColimaVMStats(),
                    getColimaDataDisk(),
                ]);
                if (!mounted)
                    return;
                if (!statusData) {
                    setError('Colima is not installed or not configured');
                    setLoading(false);
                    return;
                }
                if (!statusData.running) {
                    setError('Colima is not running. Start it with: colima start');
                    setLoading(false);
                    return;
                }
                setStatus(statusData);
                setVMStats(vmStatsData);
                setDataDisk(dataDiskData);
                setLoading(false);
            }
            catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                    setLoading(false);
                }
            }
        }
        fetchData();
        return () => {
            mounted = false;
        };
    }, []);
    if (loading) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, null, "Loading Colima VM metrics...")));
    }
    if (error) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" },
                "Error: ",
                error)));
    }
    if (!status) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" }, "Colima status unavailable")));
    }
    const diskWarning = dataDisk && dataDisk.usedPercent >= 80;
    const memWarning = vmStats && (vmStats.memoryUsedBytes / vmStats.memoryTotalBytes) >= 0.8;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Colima VM Status")),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Runtime:     "),
                React.createElement(Text, null, status.runtime)),
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Architecture: "),
                React.createElement(Text, null, status.arch)),
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "VM Type:     "),
                React.createElement(Text, null, status.vmType)),
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "CPU Cores:   "),
                React.createElement(Text, null, status.cpu))),
        vmStats && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true }, "VM Resources")),
            React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, null,
                        "CPU Usage: ",
                        vmStats.cpuUsagePercent.toFixed(1),
                        "%")),
                React.createElement(ResourceBar, { label: "Memory:", used: vmStats.memoryUsedBytes, total: vmStats.memoryTotalBytes, width: 40 }),
                memWarning && (React.createElement(Box, { marginLeft: 1 },
                    React.createElement(Text, { color: "yellow" }, "\u26A0\uFE0F"))),
                React.createElement(ResourceBar, { label: "Root Disk:", used: vmStats.diskUsedBytes, total: vmStats.diskTotalBytes, width: 40 })))),
        dataDisk && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true }, "Data Disk (Docker Storage)")),
            React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Box, { width: 16 },
                        React.createElement(Text, { dimColor: true }, "Mount Point:")),
                    React.createElement(Text, null, dataDisk.mountPoint)),
                React.createElement(ResourceBar, { label: "Disk Usage:", used: dataDisk.usedBytes, total: dataDisk.totalBytes, width: 40 }),
                diskWarning && (React.createElement(Box, { marginLeft: 1 },
                    React.createElement(Text, { color: "yellow" }, "\u26A0\uFE0F"))),
                dataDisk.availableBytes > 0 && (React.createElement(Box, { marginTop: 1 },
                    React.createElement(Box, { width: 16 },
                        React.createElement(Text, { dimColor: true }, "Available:")),
                    React.createElement(Text, null, formatBytes(dataDisk.availableBytes))))),
            diskWarning && (React.createElement(Box, { marginTop: 1, paddingX: 1, borderStyle: "round", borderColor: "yellow" },
                React.createElement(Text, { color: "yellow" },
                    "\u26A0\uFE0F  Warning: Data disk is ",
                    dataDisk.usedPercent,
                    "% full. Run 'dm clean' or 'dm sculptor' to free space."))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Tip: This data disk is where Docker images, containers, and volumes are stored."))));
}
