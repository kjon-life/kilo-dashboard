import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getSculptorImages, cleanupSculptorImages } from '../utils/docker.js';
import { formatBytes } from '../utils/exec.js';
export function SculptorView({ olderThanDays = 14, autoClean = false }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cleaning, setCleaning] = useState(false);
    const [cleanupResult, setCleanupResult] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            try {
                const sculptorImages = await getSculptorImages();
                if (!mounted)
                    return;
                setImages(sculptorImages);
                setLoading(false);
                // Auto-clean if requested
                if (autoClean && sculptorImages.length > 0) {
                    const oldImages = sculptorImages.filter(img => img.ageInDays > olderThanDays && !img.inUse);
                    if (oldImages.length > 0) {
                        setCleaning(true);
                        const result = await cleanupSculptorImages(olderThanDays);
                        if (mounted) {
                            setCleanupResult(result);
                            setCleaning(false);
                            // Refresh images list
                            const updatedImages = await getSculptorImages();
                            setImages(updatedImages);
                        }
                    }
                }
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
    }, [olderThanDays, autoClean]);
    if (loading) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, null, "Loading Sculptor images...")));
    }
    if (error) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" },
                "Error: ",
                error)));
    }
    if (cleaning) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "yellow" }, "Cleaning up old Sculptor images...")));
    }
    if (cleanupResult) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" },
                "\u2713 Cleaned up ",
                cleanupResult.removed,
                " Sculptor images"),
            React.createElement(Text, { color: "green" },
                "Reclaimed: ",
                formatBytes(cleanupResult.reclaimed))));
    }
    if (images.length === 0) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, null, "No Sculptor images found."),
            React.createElement(Text, { dimColor: true }, "Sculptor images follow the pattern: sculptor-prj_*-snapshot")));
    }
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const oldImages = images.filter(img => img.ageInDays > olderThanDays);
    const oldImagesSize = oldImages.reduce((sum, img) => sum + img.size, 0);
    const oldImagesNotInUse = oldImages.filter(img => !img.inUse);
    const reclaimableSize = oldImagesNotInUse.reduce((sum, img) => sum + img.size, 0);
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Sculptor Image Analysis")),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Total Sculptor images:  "),
                React.createElement(Text, null,
                    images.length,
                    " (",
                    formatBytes(totalSize),
                    ")")),
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true },
                    "Images older than ",
                    olderThanDays,
                    " days: "),
                React.createElement(Text, { color: oldImages.length > 0 ? 'yellow' : 'green' },
                    oldImages.length,
                    " (",
                    formatBytes(oldImagesSize),
                    ")")),
            oldImagesNotInUse.length > 0 && (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Reclaimable space:      "),
                React.createElement(Text, { color: "green" }, formatBytes(reclaimableSize))))),
        oldImages.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true },
                    "Old Sculptor Images (older than ",
                    olderThanDays,
                    " days):")),
            React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
                oldImages.slice(0, 10).map((image) => (React.createElement(Box, { key: image.id },
                    React.createElement(Box, { width: 30 },
                        React.createElement(Text, null, image.projectName)),
                    React.createElement(Box, { width: 12 },
                        React.createElement(Text, { dimColor: true },
                            image.ageInDays,
                            " days old")),
                    React.createElement(Box, { width: 12 },
                        React.createElement(Text, null, formatBytes(image.size))),
                    image.inUse && (React.createElement(Text, { color: "yellow" }, " (in use)"))))),
                oldImages.length > 10 && (React.createElement(Box, { marginTop: 1 },
                    React.createElement(Text, { dimColor: true },
                        "... and ",
                        oldImages.length - 10,
                        " more")))))),
        oldImagesNotInUse.length > 0 && (React.createElement(Box, { marginTop: 1, paddingX: 1, borderStyle: "round", borderColor: "green" },
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Text, { color: "green" }, "\uD83D\uDCA1 Cleanup suggestion:"),
                React.createElement(Text, { dimColor: true },
                    "Run 'dm sculptor clean --older-than ",
                    olderThanDays,
                    "d' to reclaim ",
                    formatBytes(reclaimableSize))))),
        oldImages.length === 0 && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "green" },
                "\u2713 No old Sculptor images to clean up. All images are recent (less than ",
                olderThanDays,
                " days old)."))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Note: Sculptor snapshots are disposable. Your code lives in git repos, not Docker images."))));
}
