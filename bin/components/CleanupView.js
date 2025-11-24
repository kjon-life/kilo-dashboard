import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { cleanupDryRun, cleanup } from '../utils/docker.js';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function CleanupView({ autoConfirm = false }) {
    const { exit } = useApp();
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [complete, setComplete] = useState(false);
    const [stats, setStats] = useState(null);
    const [options, setOptions] = useState([]);
    const [cursor, setCursor] = useState(0);
    useEffect(() => {
        (async () => {
            const cleanupStats = await cleanupDryRun();
            setStats(cleanupStats);
            const opts = [];
            if (cleanupStats.containers.count > 0) {
                opts.push({
                    key: 'containers',
                    label: `Stopped containers (${cleanupStats.containers.count})`,
                    count: cleanupStats.containers.count,
                    bytes: cleanupStats.containers.bytes,
                    selected: true,
                });
            }
            if (cleanupStats.images.count > 0) {
                opts.push({
                    key: 'images',
                    label: `Dangling images (${cleanupStats.images.count})`,
                    count: cleanupStats.images.count,
                    bytes: cleanupStats.images.bytes,
                    selected: true,
                });
            }
            if (cleanupStats.volumes.count > 0) {
                opts.push({
                    key: 'volumes',
                    label: `Unused volumes (${cleanupStats.volumes.count})`,
                    count: cleanupStats.volumes.count,
                    bytes: cleanupStats.volumes.bytes,
                    selected: false, // Default off for volumes (can contain data)
                });
            }
            if (cleanupStats.buildCache.bytes > 0) {
                opts.push({
                    key: 'buildCache',
                    label: 'Build cache',
                    bytes: cleanupStats.buildCache.bytes,
                    selected: true,
                });
            }
            setOptions(opts);
            setLoading(false);
            // Auto-run if requested
            if (autoConfirm && opts.length > 0) {
                runCleanup(opts);
            }
        })();
    }, [autoConfirm]);
    const runCleanup = async (opts) => {
        setRunning(true);
        const targets = {
            containers: opts.find(o => o.key === 'containers')?.selected || false,
            images: opts.find(o => o.key === 'images')?.selected || false,
            volumes: opts.find(o => o.key === 'volumes')?.selected || false,
            buildCache: opts.find(o => o.key === 'buildCache')?.selected || false,
        };
        await cleanup(targets);
        setRunning(false);
        setComplete(true);
        setTimeout(() => exit(), 1500);
    };
    useInput((input, key) => {
        if (loading || running || complete)
            return;
        if (input === 'q') {
            exit();
            return;
        }
        if (key.upArrow && cursor > 0) {
            setCursor(c => c - 1);
        }
        if (key.downArrow && cursor < options.length - 1) {
            setCursor(c => c + 1);
        }
        if (input === ' ') {
            setOptions(opts => opts.map((o, i) => i === cursor ? { ...o, selected: !o.selected } : o));
        }
        if (key.return) {
            const selected = options.filter(o => o.selected);
            if (selected.length > 0) {
                runCleanup(options);
            }
        }
    });
    if (loading) {
        return React.createElement(Text, { color: "gray" }, "Analyzing Docker resources...");
    }
    if (options.length === 0) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" }, "\u2713 Nothing to clean up!"),
            React.createElement(Text, { color: "gray" }, "Your Docker environment is already tidy.")));
    }
    if (complete) {
        const totalCleaned = options
            .filter(o => o.selected)
            .reduce((sum, o) => sum + o.bytes, 0);
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" }, "\u2713 Cleanup complete!"),
            React.createElement(Text, null,
                "Reclaimed approximately ",
                formatBytes(totalCleaned))));
    }
    if (running) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "cyan" }, "\u27F3 Running cleanup..."),
            options.filter(o => o.selected).map(o => (React.createElement(Text, { key: o.key, color: "gray" },
                "  \u2022 ",
                o.label)))));
    }
    const selectedTotal = options
        .filter(o => o.selected)
        .reduce((sum, o) => sum + o.bytes, 0);
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { bold: true, color: "cyan" }, "Docker Cleanup"),
        React.createElement(Text, { color: "gray" }, "Select items to clean (space to toggle, enter to run)"),
        React.createElement(Box, { marginY: 1, flexDirection: "column" }, options.map((opt, i) => (React.createElement(Box, { key: opt.key },
            React.createElement(Text, { color: i === cursor ? 'cyan' : 'white' }, i === cursor ? '▸ ' : '  '),
            React.createElement(Text, { color: opt.selected ? 'green' : 'gray' }, opt.selected ? '☑' : '☐'),
            React.createElement(Text, null,
                " ",
                opt.label),
            React.createElement(Text, { color: "gray" },
                " - ",
                formatBytes(opt.bytes)))))),
        React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, null,
                "Will reclaim: ",
                React.createElement(Text, { color: "green" }, formatBytes(selectedTotal)))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "gray" }, "\u2191/\u2193 navigate \u2022 space toggle \u2022 enter run \u2022 q quit"))));
}
