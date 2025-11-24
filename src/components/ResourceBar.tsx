import React from 'react';
import { Box, Text } from 'ink';

interface ResourceBarProps {
  label: string;
  used: number;
  total: number;
  width?: number;
  showBytes?: boolean;
  formatFn?: (bytes: number) => string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ResourceBar({ 
  label, 
  used, 
  total, 
  width = 30, 
  showBytes = true,
  formatFn = formatBytes 
}: ResourceBarProps): React.ReactElement {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const filledWidth = Math.round((percent / 100) * width);
  const emptyWidth = width - filledWidth;
  
  const color = percent < 60 ? 'green' : percent < 85 ? 'yellow' : 'red';
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  return (
    <Box>
      <Box width={14}>
        <Text>{label}</Text>
      </Box>
      <Text color={color}>{filled}</Text>
      <Text color="gray">{empty}</Text>
      <Text> </Text>
      <Text color={color}>{percent.toFixed(1)}%</Text>
      {showBytes && (
        <Text color="gray"> ({formatFn(used)}/{formatFn(total)})</Text>
      )}
    </Box>
  );
}

interface MiniBarProps {
  percent: number;
  width?: number;
}

export function MiniBar({ percent, width = 10 }: MiniBarProps): React.ReactElement {
  const filledWidth = Math.round((percent / 100) * width);
  const emptyWidth = width - filledWidth;
  
  const color = percent < 60 ? 'green' : percent < 85 ? 'yellow' : 'red';
  
  return (
    <Text>
      <Text color={color}>{'█'.repeat(filledWidth)}</Text>
      <Text color="gray">{'░'.repeat(emptyWidth)}</Text>
    </Text>
  );
}
