import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { getContainers, getContainerStats } from '../utils/docker.js';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function ContainersView() {
    const { exit } = useApp();
    const [loading, setLoading] = useState(true);
    const [containers, setContainers] = useState([]);
    const [cursor, setCursor] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const refresh = async () => {
        setLoading(true);
        let list = await getContainers();
        const stats = await getContainerStats();
        list = list.map(c => ({
            ...c,
            ...stats.get(c.id),
        }));
        setContainers(list);
        setLoading(false);
    };
    useEffect(() => {
        refresh();
    }, []);
    useInput((input, key) => {
        if (input === 'q')
            exit();
        if (input === 'r')
            refresh();
        if (key.upArrow && cursor > 0) {
            setCursor(c => c - 1);
        }
        if (key.downArrow && cursor < containers.length - 1) {
            setCursor(c => c + 1);
        }
        if (key.return) {
            setShowDetails(d => !d);
        }
    });
    if (loading) {
        return React.createElement(Text, { color: "gray" }, "Loading containers...");
    }
    if (containers.length === 0) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { bold: true, color: "cyan" }, "Containers"),
            React.createElement(Text, { color: "gray" }, "No containers found")));
    }
    const selected = containers[cursor];
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { bold: true, color: "cyan" },
            "Containers (",
            containers.length,
            ")"),
        React.createElement(Text, { color: "gray" }, "\u2191/\u2193 select \u2022 enter details \u2022 r refresh \u2022 q quit"),
        React.createElement(Box, { marginY: 1, flexDirection: "column" }, containers.map((c, i) => (React.createElement(Box, { key: c.id },
            React.createElement(Text, { color: i === cursor ? 'cyan' : 'white' }, i === cursor ? '▸ ' : '  '),
            React.createElement(Text, { color: c.running ? 'green' : 'gray' }, c.running ? '●' : '○'),
            React.createElement(Box, { width: 35 },
                React.createElement(Text, null,
                    " ",
                    c.name.substring(0, 32))),
            c.running && (React.createElement(React.Fragment, null,
                React.createElement(Box, { width: 10 },
                    React.createElement(Text, { color: "gray" }, "CPU "),
                    React.createElement(Text, null,
                        (c.cpuPercent || 0).toFixed(1),
                        "%")),
                React.createElement(Box, { width: 12 },
                    React.createElement(Text, { color: "gray" }, "MEM "),
                    React.createElement(Text, null, formatBytes(c.memUsage || 0))))),
            !c.running && (React.createElement(Text, { color: "gray" }, c.status)))))),
        showDetails && selected && (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 1, marginTop: 1 },
            React.createElement(Text, { bold: true }, selected.name),
            React.createElement(Text, { color: "gray" },
                "ID: ",
                selected.id),
            React.createElement(Text, { color: "gray" },
                "Image: ",
                selected.image),
            React.createElement(Text, { color: "gray" },
                "Status: ",
                selected.status),
            React.createElement(Text, { color: "gray" },
                "Created: ",
                selected.created),
            React.createElement(Text, { color: "gray" },
                "Size: ",
                formatBytes(selected.size),
                " (virtual: ",
                formatBytes(selected.virtualSize),
                ")"),
            selected.running && (React.createElement(React.Fragment, null,
                React.createElement(Text, { color: "gray" },
                    "CPU: ",
                    (selected.cpuPercent || 0).toFixed(2),
                    "%"),
                React.createElement(Text, { color: "gray" },
                    "Memory: ",
                    formatBytes(selected.memUsage || 0),
                    " / ",
                    formatBytes(selected.memLimit || 0),
                    " (",
                    (selected.memPercent || 0).toFixed(1),
                    "%)"),
                React.createElement(Text, { color: "gray" },
                    "Net I/O: ",
                    formatBytes(selected.netIO?.rx || 0),
                    " / ",
                    formatBytes(selected.netIO?.tx || 0)),
                React.createElement(Text, { color: "gray" },
                    "Block I/O: ",
                    formatBytes(selected.blockIO?.read || 0),
                    " / ",
                    formatBytes(selected.blockIO?.write || 0))))))));
}
