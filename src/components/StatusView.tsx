import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { getSystemInfo, type MacOSSystem } from '../utils/system.js';
import { getColimaStatus, getColimaDataDisk, type ColimaStatus, type ColimaDataDisk } from '../utils/colima.js';
import {
  isDockerRunning,
  getContainers,
  getSystemDF,
  cleanupDryRun,
  type DockerContainer,
  type DockerSystemDF,
  type CleanupStats
} from '../utils/docker.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function bar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const color = percent < 60 ? '\x1b[32m' : percent < 85 ? '\x1b[33m' : '\x1b[31m';
  return `${color}${'█'.repeat(filled)}\x1b[90m${'░'.repeat(empty)}\x1b[0m`;
}

export function StatusView(): React.ReactElement {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    system: MacOSSystem | null;
    colima: ColimaStatus | null;
    colimaDataDisk: ColimaDataDisk | null;
    dockerReady: boolean;
    containers: DockerContainer[];
    systemDF: DockerSystemDF | null;
    cleanup: CleanupStats | null;
  }>({
    system: null,
    colima: null,
    colimaDataDisk: null,
    dockerReady: false,
    containers: [],
    systemDF: null,
    cleanup: null,
  });
  
  useEffect(() => {
    (async () => {
      const [system, colima, dockerReady] = await Promise.all([
        getSystemInfo(),
        getColimaStatus(),
        isDockerRunning(),
      ]);

      let containers: DockerContainer[] = [];
      let systemDF: DockerSystemDF | null = null;
      let cleanup: CleanupStats | null = null;
      let colimaDataDisk: ColimaDataDisk | null = null;

      if (dockerReady) {
        [containers, systemDF, cleanup, colimaDataDisk] = await Promise.all([
          getContainers(),
          getSystemDF(),
          cleanupDryRun(),
          getColimaDataDisk(),
        ]);
      }

      setData({ system, colima, colimaDataDisk, dockerReady, containers, systemDF, cleanup });
      setLoading(false);

      // Exit after rendering
      setTimeout(() => exit(), 100);
    })();
  }, [exit]);
  
  if (loading) {
    return <Text color="gray">Loading resource status...</Text>;
  }
  
  const { system, colima, colimaDataDisk, dockerReady, containers, systemDF, cleanup } = data;
  const running = containers.filter(c => c.running).length;
  const stopped = containers.filter(c => !c.running).length;

  const memPercent = system?.memory
    ? (system.memory.used / system.memory.total) * 100
    : 0;
  const diskPercent = system?.disks?.[0]?.percentUsed || 0;

  // Colima VM data disk warning
  const vmDiskWarning = colimaDataDisk && colimaDataDisk.usedPercent >= 80;
  
  const totalReclaimable = cleanup 
    ? cleanup.images.bytes + cleanup.containers.bytes + cleanup.volumes.bytes + cleanup.buildCache.bytes
    : 0;
  
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Docker Resource Status</Text>
        <Text color="gray"> • {system?.hostname || 'unknown'}</Text>
      </Box>
      
      {/* Quick Stats */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="gray">Colima:     </Text>
          {colima?.running ? (
            <Text color="green">● running</Text>
          ) : (
            <Text color="red">○ stopped</Text>
          )}
          {colima?.running && (
            <Text color="gray"> ({colima.cpu} CPU, {formatBytes(colima.memory)} RAM)</Text>
          )}
        </Box>
        <Box>
          <Text color="gray">Docker:     </Text>
          {dockerReady ? (
            <Text color="green">● ready</Text>
          ) : (
            <Text color="red">○ unavailable</Text>
          )}
        </Box>
        <Box>
          <Text color="gray">Containers: </Text>
          <Text color="cyan">{running}</Text>
          <Text> running</Text>
          {stopped > 0 && (
            <>
              <Text color="gray">, </Text>
              <Text color="yellow">{stopped}</Text>
              <Text> stopped</Text>
            </>
          )}
        </Box>
      </Box>
      
      {/* Resource Usage */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Resource Usage:</Text>
        <Box>
          <Box width={14}><Text>  Host Memory</Text></Box>
          <Text>{bar(memPercent)}</Text>
          <Text> {memPercent.toFixed(0)}%</Text>
          <Text color="gray"> ({formatBytes(system?.memory?.used || 0)}/{formatBytes(system?.memory?.total || 0)})</Text>
        </Box>
        <Box>
          <Box width={14}><Text>  Host Disk</Text></Box>
          <Text>{bar(diskPercent)}</Text>
          <Text> {diskPercent}%</Text>
          <Text color="gray"> ({formatBytes(system?.disks?.[0]?.used || 0)}/{formatBytes(system?.disks?.[0]?.total || 0)})</Text>
        </Box>
        {colimaDataDisk && (
          <Box>
            <Box width={14}><Text>  VM Data Disk</Text></Box>
            <Text>{bar(colimaDataDisk.usedPercent)}</Text>
            <Text> {colimaDataDisk.usedPercent}%</Text>
            <Text color="gray"> ({formatBytes(colimaDataDisk.usedBytes)}/{formatBytes(colimaDataDisk.totalBytes)})</Text>
            {vmDiskWarning && <Text color="yellow"> ⚠️</Text>}
          </Box>
        )}
      </Box>
      
      {/* Docker Space */}
      {systemDF && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Docker Space:</Text>
          <Box>
            <Box width={14}><Text>  Images</Text></Box>
            <Text>{formatBytes(systemDF.images.size)}</Text>
            <Text color="gray"> ({systemDF.images.active}/{systemDF.images.total} active)</Text>
          </Box>
          <Box>
            <Box width={14}><Text>  Containers</Text></Box>
            <Text>{formatBytes(systemDF.containers.size)}</Text>
          </Box>
          <Box>
            <Box width={14}><Text>  Volumes</Text></Box>
            <Text>{formatBytes(systemDF.volumes.size)}</Text>
            <Text color="gray"> ({systemDF.volumes.active}/{systemDF.volumes.total} in use)</Text>
          </Box>
          <Box>
            <Box width={14}><Text>  Build Cache</Text></Box>
            <Text>{formatBytes(systemDF.buildCache.size)}</Text>
          </Box>
        </Box>
      )}
      
      {/* VM Disk Warning */}
      {vmDiskWarning && (
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
          <Text bold color="yellow">⚠️  VM Data Disk Critical</Text>
          <Text>
            Colima VM disk is {colimaDataDisk?.usedPercent}% full ({formatBytes(colimaDataDisk?.usedBytes || 0)}/{formatBytes(colimaDataDisk?.totalBytes || 0)})
          </Text>
          <Text color="cyan">Run: dm colima (details) • dm sculptor (cleanup) • dm clean (quick cleanup)</Text>
        </Box>
      )}

      {/* Cleanup Recommendation */}
      {totalReclaimable > 100 * 1024 * 1024 && ( // > 100MB
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
          <Text bold color="yellow">⚡ Cleanup Available</Text>
          <Text>
            Reclaimable: <Text color="green">{formatBytes(totalReclaimable)}</Text>
          </Text>
          {cleanup && cleanup.containers.count > 0 && (
            <Text color="gray">  • {cleanup.containers.count} stopped containers ({formatBytes(cleanup.containers.bytes)})</Text>
          )}
          {cleanup && cleanup.images.count > 0 && (
            <Text color="gray">  • {cleanup.images.count} dangling images ({formatBytes(cleanup.images.bytes)})</Text>
          )}
          {cleanup && cleanup.volumes.count > 0 && (
            <Text color="gray">  • {cleanup.volumes.count} unused volumes ({formatBytes(cleanup.volumes.bytes)})</Text>
          )}
          {cleanup && cleanup.buildCache.bytes > 0 && (
            <Text color="gray">  • Build cache ({formatBytes(cleanup.buildCache.bytes)})</Text>
          )}
          <Text color="cyan">Run: dm clean (quick cleanup) • dm sculptor (Sculptor images)</Text>
        </Box>
      )}
    </Box>
  );
}
