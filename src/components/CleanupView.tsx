import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { 
  cleanupDryRun, 
  cleanup,
  type CleanupStats 
} from '../utils/docker.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface CleanupOption {
  key: string;
  label: string;
  count?: number;
  bytes: number;
  selected: boolean;
}

export function CleanupView({ autoConfirm = false }: { autoConfirm?: boolean }): React.ReactElement {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [options, setOptions] = useState<CleanupOption[]>([]);
  const [cursor, setCursor] = useState(0);
  
  useEffect(() => {
    (async () => {
      const cleanupStats = await cleanupDryRun();
      setStats(cleanupStats);
      
      const opts: CleanupOption[] = [];
      
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
  
  const runCleanup = async (opts: CleanupOption[]) => {
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
    if (loading || running || complete) return;
    
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
      setOptions(opts => opts.map((o, i) => 
        i === cursor ? { ...o, selected: !o.selected } : o
      ));
    }
    
    if (key.return) {
      const selected = options.filter(o => o.selected);
      if (selected.length > 0) {
        runCleanup(options);
      }
    }
  });
  
  if (loading) {
    return <Text color="gray">Analyzing Docker resources...</Text>;
  }
  
  if (options.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Nothing to clean up!</Text>
        <Text color="gray">Your Docker environment is already tidy.</Text>
      </Box>
    );
  }
  
  if (complete) {
    const totalCleaned = options
      .filter(o => o.selected)
      .reduce((sum, o) => sum + o.bytes, 0);
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Cleanup complete!</Text>
        <Text>Reclaimed approximately {formatBytes(totalCleaned)}</Text>
      </Box>
    );
  }
  
  if (running) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">⟳ Running cleanup...</Text>
        {options.filter(o => o.selected).map(o => (
          <Text key={o.key} color="gray">  • {o.label}</Text>
        ))}
      </Box>
    );
  }
  
  const selectedTotal = options
    .filter(o => o.selected)
    .reduce((sum, o) => sum + o.bytes, 0);
  
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Docker Cleanup</Text>
      <Text color="gray">Select items to clean (space to toggle, enter to run)</Text>
      <Box marginY={1} flexDirection="column">
        {options.map((opt, i) => (
          <Box key={opt.key}>
            <Text color={i === cursor ? 'cyan' : 'white'}>
              {i === cursor ? '▸ ' : '  '}
            </Text>
            <Text color={opt.selected ? 'green' : 'gray'}>
              {opt.selected ? '☑' : '☐'} 
            </Text>
            <Text> {opt.label}</Text>
            <Text color="gray"> - {formatBytes(opt.bytes)}</Text>
          </Box>
        ))}
      </Box>
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>
          Will reclaim: <Text color="green">{formatBytes(selectedTotal)}</Text>
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">↑/↓ navigate • space toggle • enter run • q quit</Text>
      </Box>
    </Box>
  );
}
