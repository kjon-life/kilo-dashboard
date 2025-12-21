import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getSculptorImages, cleanupSculptorImages } from '../utils/docker.js';
import { formatBytes } from '../utils/exec.js';

interface SculptorViewProps {
  olderThanDays?: number;
  autoClean?: boolean;
}

export function SculptorView({ olderThanDays = 14, autoClean = false }: SculptorViewProps) {
  const [images, setImages] = useState<Awaited<ReturnType<typeof getSculptorImages>>>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    removed: number;
    reclaimed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const sculptorImages = await getSculptorImages();

        if (!mounted) return;

        setImages(sculptorImages);
        setLoading(false);

        // Auto-clean if requested
        if (autoClean && sculptorImages.length > 0) {
          const oldImages = sculptorImages.filter(
            img => img.ageInDays > olderThanDays && !img.inUse
          );

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
  }, [olderThanDays, autoClean]);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Loading Sculptor images...</Text>
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

  if (cleaning) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Cleaning up old Sculptor images...</Text>
      </Box>
    );
  }

  if (cleanupResult) {
    return (
      <Box flexDirection="column">
        <Text color="green">
          ✓ Cleaned up {cleanupResult.removed} Sculptor images
        </Text>
        <Text color="green">
          Reclaimed: {formatBytes(cleanupResult.reclaimed)}
        </Text>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No Sculptor images found.</Text>
        <Text dimColor>Sculptor images follow the pattern: sculptor-prj_*-snapshot</Text>
      </Box>
    );
  }

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const oldImages = images.filter(img => img.ageInDays > olderThanDays);
  const oldImagesSize = oldImages.reduce((sum, img) => sum + img.size, 0);
  const oldImagesNotInUse = oldImages.filter(img => !img.inUse);
  const reclaimableSize = oldImagesNotInUse.reduce((sum, img) => sum + img.size, 0);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Sculptor Image Analysis</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text dimColor>Total Sculptor images:  </Text>
          <Text>{images.length} ({formatBytes(totalSize)})</Text>
        </Box>
        <Box>
          <Text dimColor>Images older than {olderThanDays} days: </Text>
          <Text color={oldImages.length > 0 ? 'yellow' : 'green'}>
            {oldImages.length} ({formatBytes(oldImagesSize)})
          </Text>
        </Box>
        {oldImagesNotInUse.length > 0 && (
          <Box>
            <Text dimColor>Reclaimable space:      </Text>
            <Text color="green">{formatBytes(reclaimableSize)}</Text>
          </Box>
        )}
      </Box>

      {oldImages.length > 0 && (
        <>
          <Box marginBottom={1}>
            <Text bold>Old Sculptor Images (older than {olderThanDays} days):</Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            {oldImages.slice(0, 10).map((image) => (
              <Box key={image.id}>
                <Box width={30}>
                  <Text>
                    {image.projectName}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text dimColor>
                    {image.ageInDays} days old
                  </Text>
                </Box>
                <Box width={12}>
                  <Text>
                    {formatBytes(image.size)}
                  </Text>
                </Box>
                {image.inUse && (
                  <Text color="yellow"> (in use)</Text>
                )}
              </Box>
            ))}
            {oldImages.length > 10 && (
              <Box marginTop={1}>
                <Text dimColor>... and {oldImages.length - 10} more</Text>
              </Box>
            )}
          </Box>
        </>
      )}

      {oldImagesNotInUse.length > 0 && (
        <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="green">
          <Box flexDirection="column">
            <Text color="green">
              💡 Cleanup suggestion:
            </Text>
            <Text dimColor>
              Run 'dm sculptor clean --older-than {olderThanDays}d' to reclaim {formatBytes(reclaimableSize)}
            </Text>
          </Box>
        </Box>
      )}

      {oldImages.length === 0 && (
        <Box marginTop={1}>
          <Text color="green">
            ✓ No old Sculptor images to clean up. All images are recent (less than {olderThanDays} days old).
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Note: Sculptor snapshots are disposable. Your code lives in git repos, not Docker images.
        </Text>
      </Box>
    </Box>
  );
}
