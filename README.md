# kilo-dashboard
**Last Update**: 2025-11-24

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)
![pnpm](https://img.shields.io/badge/pnpm-9.14-f69220.svg)

━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Layered visibility into macOS → Colima VM → Docker resource hierarchy**

Built with [Ink](https://github.com/vadimdemedes/ink) — the same React-for-CLI framework that powers Claude Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Installation

```bash
./install.sh
```

Add to `.zshrc`:

```bash
export DM_BIN="$HOME/Dev/utils/kilo-dashboard/bin/dm.js"
source "$HOME/Dev/utils/kilo-dashboard/dm.zsh"
```

## Usage

```bash
dm              # status
dm dashboard    # interactive
dm clean        # cleanup wizard
dm containers   # container details
```

**Aliases**: `dms` `dmd` `dmc`

## Why

### Layered Visibility

Shows the resource flow from **macOS → Colima VM → Docker daemon**, to understand where disk is allocated.

```
┌─ macOS System ────────────────────────────────────────────┐
  Memory    ████████████░░░░░░░░░░░░░░░░░░ 58.2% (9.3GB/16GB)
  Disk      ████████████████░░░░░░░░░░░░░░ 67.3% (345GB/512GB)

┌─ Colima VM ───────────────────────────────────────────────┐
  4 CPUs • 8GB RAM • 60GB disk • vz
  VM Memory ██████████████░░░░░░░░░░░░░░░░ 72.1% (5.8GB/8GB)
  VM Disk   ████████████████████░░░░░░░░░░ 82.4% (49GB/60GB)

┌─ Docker Resources ────────────────────────────────────────┐
  Images:      84.2GB (63.5GB reclaimable)
  Containers:  1/4 running
  Volumes:     7.9GB (1.6GB reclaimable)
  Build Cache: 4.3GB (4.3GB reclaimable)
```

### Actionable Output

Instead of raw numbers, it shows **"63GB reclaimable"** and offers `dm clean` to reclaim it.

### Proper Component Architecture

Built with Ink (React for CLI), not string concatenation. Same framework Claude Code uses for its terminal UI.

### Pure zsh Fallback

If Node isn't available, core `status` and `clean` commands still work via `dm.zsh`.

## Requirements

- macOS (Apple Silicon or Intel)
- Node.js 18+
- pnpm 9+
- Colima
- zsh

## Tech Stack

- **Ink** — React for CLI
- **TypeScript** — Type safety
- **Commander** — CLI parsing
- **zsh** — Shell integration & fallback

## Structure

```
kilo-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── StatusView.tsx      # Quick status
│   │   ├── CleanupView.tsx     # Cleanup wizard
│   │   ├── ContainersView.tsx  # Container details
│   │   ├── Header.tsx          # Dashboard header
│   │   └── ResourceBar.tsx     # Progress bars
│   ├── utils/
│   │   ├── colima.ts           # Colima VM stats
│   │   ├── docker.ts           # Docker API
│   │   ├── system.ts           # macOS system stats
│   │   └── exec.ts             # Command execution
│   └── dm.tsx                  # CLI entry point
├── dm.zsh                      # Shell integration
└── install.sh                  # Installer
```

## Development

```bash
pnpm install
pnpm build
pnpm dev        # watch mode
```

## Contributing Upstream

**Note for Contributors**: Before adding major features to kilo-dashboard, consider contributing the macOS → Colima → Docker layering logic to [LazyDocker](https://github.com/jesseduffield/lazydocker) instead.

LazyDocker is:
- **Go-based** — More performant, single-binary distribution
- **Extensible** — Plugin architecture for custom views
- **Actively maintained** — Larger community and contributor base
- **Colima-aware** — Already integrates with Colima CLI

The layered visibility concept (macOS → Colima VM → Docker) would benefit LazyDocker's broader user base rather than remaining in this one-off tool.

### What Could Be Contributed

- Colima VM resource tracking (CPU, memory, disk allocation)
- macOS system resource integration
- Three-tier hierarchy visualization
- Colima-specific optimizations and health checks

kilo-dashboard serves as a proof-of-concept. For production-grade tooling, LazyDocker is likely the better community-oriented option.

## License

MIT © kjon-life
