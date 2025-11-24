#!/usr/bin/env zsh
# kilo-dashboard: macOS → Colima → Docker resource monitor
# Source this in your .zshrc for quick access
#
# Usage:
#   dm              # Quick status
#   dm dashboard    # Interactive dashboard
#   dm clean        # Cleanup wizard
#   dm containers   # Container list
#   dms            # Quick status (alias)
#   dmc            # Quick cleanup (alias)
#   dmd            # Dashboard (alias)

# Path to the dm tool (adjust after installation)
DM_BIN="${DM_BIN:-$HOME/Dev/utils/kilo-dashboard/bin/dm.js}"

# Main dm function - delegates to Node tool if available, otherwise uses fallback
dm() {
    if [[ -f "$DM_BIN" ]]; then
        node "$DM_BIN" "$@"
    else
        # Fallback: pure zsh implementation for quick status
        _dm_quick_status "$@"
    fi
}

# Quick aliases
alias dms='dm status'
alias dmc='dm clean'
alias dmd='dm dashboard'

# Fallback pure-zsh status (works without Node)
_dm_quick_status() {
    local cmd="${1:-status}"
    
    case "$cmd" in
        status|s)
            _dm_fallback_status
            ;;
        clean|prune)
            _dm_fallback_clean
            ;;
        help|--help|-h)
            _dm_show_help
            ;;
        *)
            echo "Unknown command: $cmd"
            _dm_show_help
            ;;
    esac
}

_dm_fallback_status() {
    echo "╭─ Docker Resource Status ─────────────────────────────────────╮"
    
    # Colima status
    local colima_status
    if colima_status=$(colima status --json 2>/dev/null); then
        local running=$(echo "$colima_status" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        local cpu=$(echo "$colima_status" | grep -o '"cpu":[0-9]*' | cut -d: -f2)
        local mem=$(echo "$colima_status" | grep -o '"memory":[0-9]*' | cut -d: -f2)
        
        if [[ "$running" == "Running" ]]; then
            echo "│ Colima:     \033[32m●\033[0m running ($cpu CPU, ${mem}GB RAM)"
        else
            echo "│ Colima:     \033[31m○\033[0m stopped"
        fi
    else
        echo "│ Colima:     \033[31m○\033[0m not installed or not configured"
    fi
    
    # Docker status
    if docker info >/dev/null 2>&1; then
        local containers_running=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
        local containers_total=$(docker ps -aq 2>/dev/null | wc -l | tr -d ' ')
        echo "│ Docker:     \033[32m●\033[0m ready ($containers_running/$containers_total containers running)"
    else
        echo "│ Docker:     \033[31m○\033[0m unavailable"
        echo "╰─────────────────────────────────────────────────────────────╯"
        return 1
    fi
    
    echo "├───────────────────────────────────────────────────────────────┤"
    
    # Docker system df
    local df_output
    df_output=$(docker system df 2>/dev/null)
    
    if [[ -n "$df_output" ]]; then
        echo "$df_output" | tail -n +2 | while read -r line; do
            local type=$(echo "$line" | awk '{print $1}')
            local total=$(echo "$line" | awk '{print $2}')
            local active=$(echo "$line" | awk '{print $3}')
            local size=$(echo "$line" | awk '{print $4}')
            local reclaimable=$(echo "$line" | awk '{print $5}')
            
            printf "│ %-12s %s/%s active, %s" "$type:" "$active" "$total" "$size"
            if [[ -n "$reclaimable" && "$reclaimable" != "0B" ]]; then
                printf " (\033[32m%s reclaimable\033[0m)" "$reclaimable"
            fi
            echo ""
        done
    fi
    
    echo "╰─────────────────────────────────────────────────────────────╯"
    
    # Cleanup hint
    local reclaimable_bytes=$(docker system df --format '{{.Reclaimable}}' 2>/dev/null | head -1)
    if [[ -n "$reclaimable_bytes" && "$reclaimable_bytes" != "0B" ]]; then
        echo ""
        echo "\033[33m⚡ Tip: Run 'dm clean' to reclaim space\033[0m"
    fi
}

_dm_fallback_clean() {
    echo "Docker Cleanup"
    echo "=============="
    
    # Show what will be cleaned
    echo ""
    echo "This will remove:"
    
    local stopped=$(docker ps -aq -f status=exited 2>/dev/null | wc -l | tr -d ' ')
    local dangling=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l | tr -d ' ')
    
    echo "  • $stopped stopped containers"
    echo "  • $dangling dangling images"
    echo "  • Unused networks"
    echo "  • Build cache"
    echo ""
    
    read -q "?Continue? (y/n) "
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Cleaning..."
        docker system prune -f
        echo ""
        echo "\033[32m✓ Cleanup complete\033[0m"
    else
        echo "Cancelled"
    fi
}

_dm_show_help() {
    cat << 'EOF'
kilo-dashboard — macOS → Colima → Docker resource monitor

Commands:
  dm                Quick status (default)
  dm status, dms    Quick status
  dm dashboard, dmd Interactive dashboard (requires Node)
  dm clean, dmc     Cleanup wizard
  dm containers     Container list (requires Node)
  dm help           This help

Examples:
  dm                Show quick status
  dms               Same as above
  dm clean          Interactive cleanup
  dmc               Same as above
  dmd               Full interactive dashboard
EOF
}

# Completion
if [[ -n "$ZSH_VERSION" ]]; then
    _dm_completion() {
        local -a commands
        commands=(
            'status:Quick resource status'
            'dashboard:Interactive dashboard'
            'clean:Cleanup wizard'
            'containers:Container list'
            'help:Show help'
        )
        _describe 'command' commands
    }
    compdef _dm_completion dm
fi
