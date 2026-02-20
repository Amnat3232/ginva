#!/bin/bash
set -e

echo "🚀 Setting up GINVA development environment (non-interactive)..."

# Set versions
export SOLANA_VERSION=${SOLANA_VERSION:-1.18.26}
export ANCHOR_VERSION=${ANCHOR_VERSION:-0.29.0}

# Install Solana CLI
echo "📦 Installing Solana CLI $SOLANA_VERSION..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL "https://release.solana.com/v${SOLANA_VERSION}/install")"
fi

# Add to PATH permanently
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor CLI
echo "📦 Installing Anchor CLI $ANCHOR_VERSION..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION} --locked
fi

# Add cargo bin to PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.cargo/bin:$PATH"

# Install NPM dependencies
echo "📦 Installing Node dependencies..."
npm install

# Install Frontend dependencies
if [ -d "app" ]; then
    cd app && npm install && cd ..
fi

# Build the program
echo "🔨 Building Anchor program..."
anchor build

# Setup Solana config for devnet
echo "⚙️ Configuring Solana for devnet..."
solana config set --url devnet

# Create keypair if not exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Creating Solana keypair..."
    mkdir -p ~/.config/solana
    solana-keygen new --no-bip39-passphrase --silent --outfile ~/.config/solana/id.json 2>/dev/null || true
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Quick commands:"
echo "  anchor test       - Run tests"
echo "  anchor build      - Build program"
echo "  anchor deploy     - Deploy to devnet"
echo ""
echo "🎉 Welcome to GINVA development!"
