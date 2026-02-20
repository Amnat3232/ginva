#!/bin/bash
set -e

echo "🚀 Setting up GINVA development environment..."

# Install Solana CLI
echo "📦 Installing Solana CLI..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL "https://release.solana.com/v${SOLANA_VERSION:-1.18.26}/install")"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Install Anchor CLI
echo "📦 Installing Anchor CLI..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION:-0.29.0} --locked
fi

# Install NPM dependencies
echo "📦 Installing Node dependencies..."
npm install

# Install Frontend dependencies
if [ -d "app" ]; then
    cd app && npm install && cd ..
fi

# Install Frontend dependencies (alternative location)
if [ -d "frontend" ]; then
    cd frontend && npm install && cd ..
fi

# Build the program
echo "🔨 Building Anchor program..."
anchor build

# Setup Solana config for devnet
echo "⚙️ Configuring Solana..."
solana config set --url devnet

echo "✅ Setup complete! Run 'anchor test' to verify."

# Optional: Create keypair if not exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Creating Solana keypair..."
    solana-keygen new --no-bip39-passphrase --silent --outfile ~/.config/solana/id.json 2>/dev/null || true
fi

echo "🎉 Welcome to GINVA development!"
