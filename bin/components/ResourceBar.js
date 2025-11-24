import React from 'react';
import { Box, Text } from 'ink';
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function ResourceBar({ label, used, total, width = 30, showBytes = true, formatFn = formatBytes }) {
    const percent = total > 0 ? (used / total) * 100 : 0;
    const filledWidth = Math.round((percent / 100) * width);
    const emptyWidth = width - filledWidth;
    const color = percent < 60 ? 'green' : percent < 85 ? 'yellow' : 'red';
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    return (React.createElement(Box, null,
        React.createElement(Box, { width: 14 },
            React.createElement(Text, null, label)),
        React.createElement(Text, { color: color }, filled),
        React.createElement(Text, { color: "gray" }, empty),
        React.createElement(Text, null, " "),
        React.createElement(Text, { color: color },
            percent.toFixed(1),
            "%"),
        showBytes && (React.createElement(Text, { color: "gray" },
            " (",
            formatFn(used),
            "/",
            formatFn(total),
            ")"))));
}
export function MiniBar({ percent, width = 10 }) {
    const filledWidth = Math.round((percent / 100) * width);
    const emptyWidth = width - filledWidth;
    const color = percent < 60 ? 'green' : percent < 85 ? 'yellow' : 'red';
    return (React.createElement(Text, null,
        React.createElement(Text, { color: color }, '█'.repeat(filledWidth)),
        React.createElement(Text, { color: "gray" }, '░'.repeat(emptyWidth))));
}
