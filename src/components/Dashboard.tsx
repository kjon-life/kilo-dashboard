import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Header } from './Header.js';
import { ResourceBar } from './ResourceBar.js';
import { getSystemInfo, type MacOSSystem } from '../utils/system.js';
import { getColimaStatus, getColimaVMStats, type ColimaStatus, type ColimaVMStats } from '../utils/colima.js';
import { 
  isDockerRunning, 
  getContainers, 
  getContainerStats, 
  getSystemDF,
  type DockerContainer,
  type DockerSystemDF 
} from '../utils/docker.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface DashboardState {
  loading: boolean;
  system: MacOSSystem | null;
  colima: ColimaStatus | null;
  colimaVM: ColimaVMStats | null;
  dockerReady: boolean;
  containers: DockerContainer[];
  systemDF: DockerSystemDF | null;
  lastUpdate: Date;
}

export function Dashboard(): React.ReactElement {
  const { exit } = useApp();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    system: null,
    colima: null,
    colimaVM: null,
    dockerReady: false,
    containers: [],
    systemDF: null,
    lastUpdate: new Date(),
  });
  
  const refresh = async () => {
    setState(s => ({ ...s, loading: true }));
    
    const [system, colima, dockerReady] = await Promise.all([
      getSystemInfo(),
      getColimaStatus(),
      isDockerRunning(),
    ]);
    
    let colimaVM: ColimaVMStats | null = null;
    let containers: DockerContainer[] = [];
    let systemDF: DockerSystemDF | null = null;
    
    if (colima?.running) {
      colimaVM = await getColimaVMStats();
    }
    
    if (dockerReady) {
      [containers, systemDF] = await Promise.all([
        getContainers(),
        getSystemDF(),
      ]);
      
      // Enrich with stats for running containers
      const stats = await getContainerStats();
      containers = containers.map(c => ({
        ...c,
        ...stats.get(c.id),
      }));
    }
    
    setState({
      loading: false,
      system,
      colima,
      colimaVM,
      dockerReady,
      containers,
      systemDF,
      lastUpdate: new Date(),
    });
  };
  
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useInput((input) => {
    if (input === 'q') exit();
    if (input === 'r') refresh();
  });
  
  const { system, colima, colimaVM, dockerReady, containers, systemDF, loading, lastUpdate } = state;
  
  const runningContainers = containers.filter(c => c.running);
  const stoppedContainers = containers.filter(c => !c.running);
  
  return (
    <Box flexDirection="column">
      <Header
        hostname={system?.hostname || 'loading...'}
        chip={system?.chip || ''}
        uptime={system?.uptime || ''}
        colimaRunning={colima?.running || false}
        dockerRunning={dockerReady}
      />
      
      {/* System Resources */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="white">┌─ macOS System ───────────────────────────────────────────┐</Text>
        {system?.memory && (
          <>
            <ResourceBar
              label="  Memory"
              used={system.memory.used}
              total={system.memory.total}
            />
            <ResourceBar
              label="  Swap"
              used={system.memory.swapUsed}
              total={system.memory.swapTotal || system.memory.swapUsed + 1}
            />
          </>
        )}
        {system?.disks?.[0] && (
          <ResourceBar
            label="  Disk"
            used={system.disks[0].used}
            total={system.disks[0].total}
          />
        )}
      </Box>
      
      {/* Colima VM */}
      {colima?.running && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="white">┌─ Colima VM ──────────────────────────────────────────────┐</Text>
          <Box paddingLeft={2}>
            <Text color="gray">
              {colima.cpu} CPUs • {formatBytes(colima.memory)} RAM • {formatBytes(colima.disk)} disk • {colima.vmType}
            </Text>
          </Box>
          {colimaVM && (
            <>
              <ResourceBar
                label="  VM Memory"
                used={colimaVM.memoryUsedBytes}
                total={colimaVM.memoryTotalBytes}
              />
              <ResourceBar
                label="  VM Disk"
                used={colimaVM.diskUsedBytes}
                total={colimaVM.diskTotalBytes}
              />
            </>
          )}
        </Box>
      )}
      
      {/* Docker Resources */}
      {dockerReady && systemDF && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="white">┌─ Docker Resources ───────────────────────────────────────┐</Text>
          <Box paddingLeft={2} flexDirection="column">
            <Box>
              <Box width={20}>
                <Text>Images:</Text>
              </Box>
              <Text color="cyan">{systemDF.images.active}/{systemDF.images.total}</Text>
              <Text color="gray"> active • </Text>
              <Text>{formatBytes(systemDF.images.size)}</Text>
              <Text color="green"> ({formatBytes(systemDF.images.reclaimable)} reclaimable)</Text>
            </Box>
            <Box>
              <Box width={20}>
                <Text>Containers:</Text>
              </Box>
              <Text color="cyan">{runningContainers.length}/{containers.length}</Text>
              <Text color="gray"> running • </Text>
              <Text>{formatBytes(systemDF.containers.size)}</Text>
            </Box>
            <Box>
              <Box width={20}>
                <Text>Volumes:</Text>
              </Box>
              <Text color="cyan">{systemDF.volumes.active}/{systemDF.volumes.total}</Text>
              <Text color="gray"> in use • </Text>
              <Text>{formatBytes(systemDF.volumes.size)}</Text>
              <Text color="green"> ({formatBytes(systemDF.volumes.reclaimable)} reclaimable)</Text>
            </Box>
            <Box>
              <Box width={20}>
                <Text>Build Cache:</Text>
              </Box>
              <Text>{formatBytes(systemDF.buildCache.size)}</Text>
              <Text color="green"> ({formatBytes(systemDF.buildCache.reclaimable)} reclaimable)</Text>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Running Containers */}
      {runningContainers.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="white">┌─ Running Containers ─────────────────────────────────────┐</Text>
          {runningContainers.slice(0, 5).map((c) => (
            <Box key={c.id} paddingLeft={2}>
              <Box width={35}>
                <Text color="green">● </Text>
                <Text>{c.name.substring(0, 32)}</Text>
              </Box>
              <Box width={15}>
                <Text color="gray">CPU: </Text>
                <Text color={c.cpuPercent && c.cpuPercent > 50 ? 'yellow' : 'white'}>
                  {c.cpuPercent?.toFixed(1) || '0'}%
                </Text>
              </Box>
              <Box width={20}>
                <Text color="gray">MEM: </Text>
                <Text>{formatBytes(c.memUsage || 0)}</Text>
              </Box>
            </Box>
          ))}
          {runningContainers.length > 5 && (
            <Box paddingLeft={2}>
              <Text color="gray">  ... and {runningContainers.length - 5} more</Text>
            </Box>
          )}
        </Box>
      )}
      
      {/* Stopped Containers */}
      {stoppedContainers.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="white">┌─ Stopped Containers ({stoppedContainers.length}) ────────────────────────────┐</Text>
          {stoppedContainers.slice(0, 3).map((c) => (
            <Box key={c.id} paddingLeft={2}>
              <Text color="gray">○ </Text>
              <Box width={35}>
                <Text color="gray">{c.name.substring(0, 32)}</Text>
              </Box>
              <Text color="gray">{c.status}</Text>
            </Box>
          ))}
          {stoppedContainers.length > 3 && (
            <Box paddingLeft={2}>
              <Text color="gray">  ... and {stoppedContainers.length - 3} more</Text>
            </Box>
          )}
        </Box>
      )}
      
      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray">
          Last updated: {lastUpdate.toLocaleTimeString()} • 
          Press 'r' to refresh • 'q' to quit
          {loading && ' • refreshing...'}
        </Text>
      </Box>
    </Box>
  );
}
