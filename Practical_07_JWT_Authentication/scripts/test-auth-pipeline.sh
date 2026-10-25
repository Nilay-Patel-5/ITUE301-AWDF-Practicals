#!/usr/bin/env bash
# ==============================================================================
# Practical 7: JWT Authentication & bcrypt Password Hashing Verification
# Bash Wrapper for Cross-Platform Pipeline Execution (Windows 11 / Git Bash / macOS)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure we execute with node
node "$SCRIPT_DIR/test-auth-pipeline.js" "$@"
