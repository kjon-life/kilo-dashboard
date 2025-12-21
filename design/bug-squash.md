# Bug Squash

## Metric Hierarchy Inaccuracy

**Issue**: The dashboard conflates host, VM, and Docker metrics instead of displaying the complete resource hierarchy.

**Current behavior**:
- Colima status shows "stopped" when running (logic bug: checks non-existent `status.status` field)
- Memory bar displays macOS host memory (13.5GB/16GB) not Colima VM memory (actual: 2GB allocated)
- Disk metrics show host filesystem, not Colima VM disk (actual: 100GB allocated)

**Required hierarchy**:
```
macOS Host (16GB RAM, ~500GB disk)
  └─ Colima VM (2GB RAM, 100GB disk)
      └─ Docker (containers, images, volumes)
```

**Needed**:
- Fix Colima running detection (successful JSON parse = running)
- Display all three layers: host metrics, Colima VM metrics, Docker metrics
- Clarify which resources belong to which layer in the UI
