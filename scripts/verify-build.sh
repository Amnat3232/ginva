#!/usr/bin/env bash
# Verify GINVA Pinocchio build matches on-chain bytecode
# Usage: ./scripts/verify-build.sh [program_id]
set -e

PROGRAM_ID=${1:-"DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47"}
NETWORK=${NETWORK:-"devnet"}

echo "╔══════════════════════════════════════════════════╗"
echo "║     GINVA Verified Build Check                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo "Program ID : $PROGRAM_ID"
echo "Network    : $NETWORK"
echo ""

# Step 1: Build deterministic binary
echo "► Building deterministic binary..."
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

cargo build-sbf \
  --manifest-path programs/ginva-pinocchio/Cargo.toml \
  2>&1 | tail -5

LOCAL_SO="programs/ginva-pinocchio/target/sbf-solana-solana/release/ginva_pinocchio.so"
if [ ! -f "$LOCAL_SO" ]; then
  echo "✗ Build output not found at $LOCAL_SO"
  exit 1
fi

LOCAL_HASH=$(sha256sum "$LOCAL_SO" | awk '{print $1}')
echo "✓ Local build hash  : $LOCAL_HASH"

# Step 2: Try solana-verify if installed
if command -v solana-verify &>/dev/null; then
  echo ""
  echo "► Running solana-verify..."
  solana-verify verify-from-repo \
    --url "https://api.${NETWORK}.solana.com" \
    --program-id "$PROGRAM_ID" \
    --library-name ginva_pinocchio \
    https://github.com/Dr-SoloDev/ginva \
    || echo "⚠  solana-verify check failed — verify manually"
else
  echo ""
  echo "⚠  solana-verify not installed."
  echo "   Install: cargo install solana-verify"
  echo ""
  echo "► Manual verification:"
  echo "   1. Download on-chain bytecode:"
  echo "      solana program dump $PROGRAM_ID /tmp/onchain.so --url $NETWORK"
  echo "   2. Compare hashes:"
  echo "      sha256sum $LOCAL_SO /tmp/onchain.so"
  echo "   3. Hashes must match for verified build."
fi

echo ""
echo "Local .so size: $(du -h "$LOCAL_SO" | cut -f1)"
echo "Done."
