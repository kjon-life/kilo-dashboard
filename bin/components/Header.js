import React from 'react';
import { Box, Text } from 'ink';
export function Header({ hostname, chip, uptime, colimaRunning, dockerRunning }) {
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true, color: "cyan" }, "\u256D\u2500 Docker Resource Dashboard \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E")),
        React.createElement(Box, { paddingLeft: 1 },
            React.createElement(Text, { color: "white" }, hostname),
            React.createElement(Text, { color: "gray" }, " \u2022 "),
            React.createElement(Text, { color: "gray" }, chip),
            React.createElement(Text, { color: "gray" }, " \u2022 up "),
            React.createElement(Text, { color: "gray" }, uptime)),
        React.createElement(Box, { paddingLeft: 1 },
            React.createElement(Text, null, "Colima: "),
            colimaRunning ? (React.createElement(Text, { color: "green" }, "\u25CF running")) : (React.createElement(Text, { color: "red" }, "\u25CB stopped")),
            React.createElement(Text, { color: "gray" }, " \u2502 "),
            React.createElement(Text, null, "Docker: "),
            dockerRunning ? (React.createElement(Text, { color: "green" }, "\u25CF ready")) : (React.createElement(Text, { color: "red" }, "\u25CB unavailable"))),
        React.createElement(Box, null,
            React.createElement(Text, { color: "cyan" }, "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F"))));
}
