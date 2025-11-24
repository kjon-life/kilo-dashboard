import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { 
  getContainers, 
  getContainerStats,
  type DockerContainer 
} from '../utils/docker.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ContainersView(): React.ReactElement {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
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
    if (input === 'q') exit();
    if (input === 'r') refresh();
    
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
    return <Text color="gray">Loading containers...</Text>;
  }
  
  if (containers.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">Containers</Text>
        <Text color="gray">No containers found</Text>
      </Box>
    );
  }
  
  const selected = containers[cursor];
  
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Containers ({containers.length})</Text>
      <Text color="gray">↑/↓ select • enter details • r refresh • q quit</Text>
      
      <Box marginY={1} flexDirection="column">
        {containers.map((c, i) => (
          <Box key={c.id}>
            <Text color={i === cursor ? 'cyan' : 'white'}>
              {i === cursor ? '▸ ' : '  '}
            </Text>
            <Text color={c.running ? 'green' : 'gray'}>
              {c.running ? '●' : '○'}
            </Text>
            <Box width={35}>
              <Text> {c.name.substring(0, 32)}</Text>
            </Box>
            {c.running && (
              <>
                <Box width={10}>
                  <Text color="gray">CPU </Text>
                  <Text>{(c.cpuPercent || 0).toFixed(1)}%</Text>
                </Box>
                <Box width={12}>
                  <Text color="gray">MEM </Text>
                  <Text>{formatBytes(c.memUsage || 0)}</Text>
                </Box>
              </>
            )}
            {!c.running && (
              <Text color="gray">{c.status}</Text>
            )}
          </Box>
        ))}
      </Box>
      
      {showDetails && selected && (
        <Box 
          flexDirection="column" 
          borderStyle="round" 
          borderColor="cyan" 
          paddingX={1}
          marginTop={1}
        >
          <Text bold>{selected.name}</Text>
          <Text color="gray">ID: {selected.id}</Text>
          <Text color="gray">Image: {selected.image}</Text>
          <Text color="gray">Status: {selected.status}</Text>
          <Text color="gray">Created: {selected.created}</Text>
          <Text color="gray">Size: {formatBytes(selected.size)} (virtual: {formatBytes(selected.virtualSize)})</Text>
          {selected.running && (
            <>
              <Text color="gray">CPU: {(selected.cpuPercent || 0).toFixed(2)}%</Text>
              <Text color="gray">Memory: {formatBytes(selected.memUsage || 0)} / {formatBytes(selected.memLimit || 0)} ({(selected.memPercent || 0).toFixed(1)}%)</Text>
              <Text color="gray">Net I/O: {formatBytes(selected.netIO?.rx || 0)} / {formatBytes(selected.netIO?.tx || 0)}</Text>
              <Text color="gray">Block I/O: {formatBytes(selected.blockIO?.read || 0)} / {formatBytes(selected.blockIO?.write || 0)}</Text>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
