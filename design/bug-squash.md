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

## Disk Space Crisis: Hidden VM Disk Exhaustion

**Issue**: Docker build failures with misleading error message ("Docker build failed - is your Docker up-to-date?") when the real problem is Colima VM disk space exhaustion.

**Root cause**:
- Sculptor's Docker images accumulated over 2 months (84 images, ~97GB)
- Colima VM data disk (`/dev/vdb1` mounted at `/mnt/lima-colima`) hit 100% full
- Error message didn't indicate disk space issue
- `dm status` only shows macOS host disk, not the VM's data disk where Docker actually stores images

**Critical diagnostic commands**:
```zsh
# 1. Check Colima VM data disk (where images actually live)
colima ssh -- df -h /mnt/lima-colima

# 2. Check Docker space breakdown by type
docker system df

# 3. Check current dm status (currently shows wrong disk)
dm status
```

**Emergency cleanup procedure** (used to resolve the crisis):
```zsh
# 1. Remove stopped containers
docker container prune -f

# 2. Remove ALL unused images (the big one - freed ~97GB)
docker image prune -a -f

# 3. Clear build cache
docker builder prune -a -f

# 4. Optional: clear unused volumes
docker volume prune -f
```

**Key insight**: User's **actual work** (code changes, commits, branches) lives in git repos under `~/Dev/` and `~/.sculptor/cached_repos/`, NOT in Docker images. The images are disposable execution environments and can be safely pruned.

**Needed enhancements**:

1. **Colima VM disk monitoring** (Priority 1)
   - `dm status` should show Colima VM disk (`/mnt/lima-colima`), not just macOS host disk
   - Add proactive warning when VM disk hits 80% capacity
   - Example output:
     ```
     Colima VM Disk: ████████████████████░ 87% (85GB/98GB) ⚠️
     ```

2. **New command: `dm colima`** (Priority 2)
   - Dedicated view for Colima VM metrics
   - Shows VM disk, memory, CPU usage
   - Surfaces the actual resource constraints where Docker runs

3. **Sculptor-specific cleanup recommendations** (Priority 3)
   - New command: `dm sculptor`
   - Lists `sculptor-prj_*-snapshot` images by age
   - Suggests pruning images older than N weeks
   - Example:
     ```
     Old Sculptor Images (>2 weeks):
     - sculptor-prj_foo-snapshot (3 weeks old, 4.2GB)
     - sculptor-prj_bar-snapshot (4 weeks old, 3.8GB)
     Potential savings: 8.0GB
     Run: dm sculptor clean --older-than 2w
     ```

4. **Enhanced `dm clean`** (Priority 4)
   - Include Sculptor image age analysis in cleanup recommendations
   - Show breakdown: "84 images (60 Sculptor snapshots, 24 base images)"
   - Prioritize old Sculptor snapshots in cleanup workflow
