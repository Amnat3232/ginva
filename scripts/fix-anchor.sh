#!/bin/bash

echo "🔧 Fixing Anchor installation..."

# 1. Clean old installations
echo "🧹 Cleaning old Anchor installations..."
rm -rf ~/.cargo/bin/anchor ~/.avm ~/.cargo/registry/src/*/anchor-cli-* 2>/dev/null

# 2. Install Anchor 0.30.1
echo "📦 Installing Anchor 0.30.1..."
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli --locked --force 2>&1 | tail -20

# 3. Check version
echo "✅ Checking Anchor version..."
~/.cargo/bin/anchor --version

echo "🎉 Done! Run 'anchor test' to verify"