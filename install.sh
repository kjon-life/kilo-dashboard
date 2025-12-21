#!/bin/bash
# Installation script for kilo-dashboard
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${1:-$HOME/Dev/utils/kilo-dashboard}"

echo "╭─ kilo-dashboard installation ─────────────────────────────────╮"
echo "│ macOS → Colima → Docker resource monitor                      │"
echo "╰───────────────────────────────────────────────────────────────╯"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "   Install with: brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
    echo "❌ Node.js 18+ required (found: $(node -v))"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ pnpm $(pnpm -v)"
echo ""

# Create install directory
if [[ "$SCRIPT_DIR" != "$INSTALL_DIR" ]]; then
    echo "Installing to: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
    cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
    cd "$INSTALL_DIR"
else
    cd "$SCRIPT_DIR"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Build TypeScript (postbuild handles shebang automatically)
echo ""
echo "Building..."
pnpm build

# Verify build
if [[ ! -f "bin/dm.js" ]]; then
    echo "❌ Build failed - bin/dm.js not found"
    exit 1
fi

echo "✓ Build complete"

echo ""
echo "╭─ Installation complete ───────────────────────────────────────╮"
echo "│                                                               │"
echo "│ Add to your .zshrc:                                           │"
echo "│                                                               │"
echo "│   export DM_BIN=\"$INSTALL_DIR/bin/dm.js\"                      "
echo "│   source \"$INSTALL_DIR/dm.zsh\"                                "
echo "│                                                               │"
echo "│ Then: source ~/.zshrc                                         │"
echo "│                                                               │"
echo "╰───────────────────────────────────────────────────────────────╯"
echo ""
echo "Usage:"
echo "  dm              # status"
echo "  dm dashboard    # interactive"
echo "  dm clean        # cleanup wizard"
echo ""
