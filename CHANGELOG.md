# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-12-21

### Added
- **VM Disk Monitoring**: New `dm colima` command shows Colima VM metrics (CPU, memory, data disk)
- **Sculptor Image Cleanup**: New `dm sculptor` command analyzes and cleans old Sculptor snapshot images
- **Proactive Warnings**: `dm status` now warns when VM data disk reaches 80% capacity
- **VM Data Disk Visibility**: Status view now shows VM data disk (`/mnt/lima-colima`) where Docker images actually live

### Changed
- **Enhanced Status View**: Clarified resource hierarchy with "Host Memory", "Host Disk", and "VM Data Disk" labels
- **Improved Cleanup Recommendations**: Status view now suggests `dm sculptor` for Sculptor-specific cleanup

### Fixed
- **Disk Space Crisis Prevention**: Tool now monitors the correct disk (VM data disk) where Docker stores images, preventing misleading "Docker build failed" errors when VM disk is full

### Documentation
- Added `design/bug-squash.md` documenting disk space crisis and diagnostic procedures
- Updated help text and zsh completion for new commands

## [0.0.0] - 2025-11-24

### Added

**Core Features**
- Interactive dashboard with real-time auto-refresh
- Quick status view (non-interactive, one-liner)
- Container details view with CPU, memory, and network stats
- Interactive cleanup wizard with dry-run preview
- zsh shell integration with aliases (`dms`, `dmd`, `dmc`)
- Tab completion for zsh

**Layered Visibility**
- macOS system resources (memory, swap, disk)
- Colima VM allocation and usage (CPU, RAM, disk)
- Docker daemon resources (images, containers, volumes, build cache)
- Running container details (name, CPU %, memory usage)

**Architecture**
- Built with Ink (React for CLI) — proper component architecture
- TypeScript for type safety
- Commander for CLI argument parsing
- Modular component structure for easy extension
- Pure zsh fallback for minimal environments

**Actionable Insights**
- Shows reclaimable space (e.g., "63GB reclaimable")
- Interactive cleanup wizard with toggleable options
- Auto-confirm mode for cleanup (`dm clean -y`)
- Resource flow visualization (macOS → Colima → Docker)

**Developer Experience**
- Single-command installation (`./install.sh`)
- Automatic shebang injection via postbuild script
- pnpm package management
- Watch mode for development (`pnpm dev`)

### Configuration

- **Package Manager**: pnpm 9.14.2
- **Node.js**: >=18
- **TypeScript**: 5.6.3
- **Target Platform**: macOS (Apple Silicon and Intel)
- **Container Runtime**: Colima

### Infrastructure

- **Build System**: TypeScript compiler (`tsc`)
- **CLI Framework**: Ink 5.0.1 (React for terminal)
- **Shell Integration**: zsh with fallback commands
- **Installation**: Automated via `install.sh`

### Architecture Decisions

1. **Ink over string concatenation** — Proper React component model for terminal UI
2. **Layered visibility** — Show the full resource hierarchy (macOS → Colima → Docker)
3. **Actionable output** — Don't just show numbers, show what you can do about them
4. **Pure zsh fallback** — Core commands work even without Node.js
5. **No Docker Desktop dependency** — Built specifically for Colima

### Notes

- This is the initial release (v0.0.0)
- Focus on Colima VM monitoring, not Docker Desktop
- Designed to work alongside Sculptor container workflows
- Uses the same CLI framework as Claude Code (Ink)

---

*For licensing, see `LICENSE.md`*
*For citation, see `CITATION.cff`*
