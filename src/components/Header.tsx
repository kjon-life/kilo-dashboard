import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  hostname: string;
  chip: string;
  uptime: string;
  colimaRunning: boolean;
  dockerRunning: boolean;
}

export function Header({
  hostname,
  chip,
  uptime,
  colimaRunning,
  dockerRunning,
}: HeaderProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          ╭─ Docker Resource Dashboard─────────────────────────────────────╮
        </Text>
      </Box>
      <Box paddingLeft={1}>
        <Text color="white">{hostname}</Text>
        <Text color="gray"> • </Text>
        <Text color="gray">{chip}</Text>
        <Text color="gray"> • up </Text>
        <Text color="gray">{uptime}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text>Colima: </Text>
        {colimaRunning ? (
          <Text color="green">● running</Text>
        ) : (
          <Text color="red">○ stopped</Text>
        )}
        <Text color="gray"> │ </Text>
        <Text>Docker: </Text>
        {dockerRunning ? (
          <Text color="green">● ready</Text>
        ) : (
          <Text color="red">○ unavailable</Text>
        )}
      </Box>
      <Box>
        <Text color="cyan">
          ╰────────────────────────────────────────────────────────────────╯
        </Text>
      </Box>
    </Box>
  );
}
