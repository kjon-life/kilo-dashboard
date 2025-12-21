import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getColimaStatus, getColimaVMStats, getColimaDataDisk } from '../utils/colima.js';
import { formatBytes } from '../utils/exec.js';
import { ResourceBar } from './ResourceBar.js';

export function ColimaView() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getColimaStatus>>>(null);
  const [vmStats, setVMStats] = useState<Awaited<ReturnType<typeof getColimaVMStats>>>(null);
  const [dataDisk, setDataDisk] = useState<Awaited<ReturnType<typeof getColimaDataDisk>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const [statusData, vmStatsData, dataDiskData] = await Promise.all([
          getColimaStatus(),
          getColimaVMStats(),
          getColimaDataDisk(),
        ]);

        if (!mounted) return;

        if (!statusData) {
          setError('Colima is not installed or not configured');
          setLoading(false);
          return;
        }

        if (!statusData.running) {
          setError('Colima is not running. Start it with: colima start');
          setLoading(false);
          return;
        }

        setStatus(statusData);
        setVMStats(vmStatsData);
        setDataDisk(dataDiskData);
        setLoading(false);
      } catch (err) {
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
  }, []);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Loading Colima VM metrics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (!status) {
    return (
      <Box flexDirection="column">
        <Text color="red">Colima status unavailable</Text>
      </Box>
    );
  }

  const diskWarning = dataDisk && dataDisk.usedPercent >= 80;
  const memWarning = vmStats && (vmStats.memoryUsedBytes / vmStats.memoryTotalBytes) >= 0.8;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Colima VM Status</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text dimColor>Runtime:     </Text>
          <Text>{status.runtime}</Text>
        </Box>
        <Box>
          <Text dimColor>Architecture: </Text>
          <Text>{status.arch}</Text>
        </Box>
        <Box>
          <Text dimColor>VM Type:     </Text>
          <Text>{status.vmType}</Text>
        </Box>
        <Box>
          <Text dimColor>CPU Cores:   </Text>
          <Text>{status.cpu}</Text>
        </Box>
      </Box>

      {vmStats && (
        <>
          <Box marginBottom={1}>
            <Text bold>VM Resources</Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Box marginBottom={1}>
              <Text>CPU Usage: {vmStats.cpuUsagePercent.toFixed(1)}%</Text>
            </Box>

            <ResourceBar
              label="Memory:"
              used={vmStats.memoryUsedBytes}
              total={vmStats.memoryTotalBytes}
              width={40}
            />
            {memWarning && (
              <Box marginLeft={1}>
                <Text color="yellow">⚠️</Text>
              </Box>
            )}

            <ResourceBar
              label="Root Disk:"
              used={vmStats.diskUsedBytes}
              total={vmStats.diskTotalBytes}
              width={40}
            />
          </Box>
        </>
      )}

      {dataDisk && (
        <>
          <Box marginBottom={1}>
            <Text bold>Data Disk (Docker Storage)</Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Box marginBottom={1}>
              <Box width={16}>
                <Text dimColor>Mount Point:</Text>
              </Box>
              <Text>{dataDisk.mountPoint}</Text>
            </Box>

            <ResourceBar
              label="Disk Usage:"
              used={dataDisk.usedBytes}
              total={dataDisk.totalBytes}
              width={40}
            />
            {diskWarning && (
              <Box marginLeft={1}>
                <Text color="yellow">⚠️</Text>
              </Box>
            )}

            {dataDisk.availableBytes > 0 && (
              <Box marginTop={1}>
                <Box width={16}>
                  <Text dimColor>Available:</Text>
                </Box>
                <Text>{formatBytes(dataDisk.availableBytes)}</Text>
              </Box>
            )}
          </Box>

          {diskWarning && (
            <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="yellow">
              <Text color="yellow">
                ⚠️  Warning: Data disk is {dataDisk.usedPercent}% full. Run 'dm clean' or 'dm sculptor' to free space.
              </Text>
            </Box>
          )}
        </>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Tip: This data disk is where Docker images, containers, and volumes are stored.
        </Text>
      </Box>
    </Box>
  );
}
