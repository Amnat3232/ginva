#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 GINVA Automatic Deployment Script${NC}"
echo "=========================================="

# Configuration
PROGRAM_ID="2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou"
CLUSTER="devnet"

# Step 1: Check environment
echo -e "\n${YELLOW}📋 Step 1: Checking environment...${NC}"

# Check solana CLI
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
    exit 1
fi
echo "✅ Solana CLI installed: $(solana --version)"

# Check anchor CLI
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install it first.${NC}"
    exit 1
fi
echo "✅ Anchor CLI installed: $(anchor --version)"

# Check wallet
if [ ! -f ~/.config/solana/id.json ]; then
    echo -e "${RED}❌ Wallet not found. Creating new wallet...${NC}"
    solana-keygen new --no-bip39-passphrase --silent --outfile ~/.config/solana/id.json
fi

WALLET_ADDRESS=$(solana address)
echo "✅ Wallet: $WALLET_ADDRESS"

# Step 2: Configure Solana
echo -e "\n${YELLOW}⚙️  Step 2: Configuring Solana...${NC}"
solana config set --url $CLUSTER
solana config set --keypair ~/.config/solana/id.json
echo "✅ Configured for $CLUSTER"

# Step 3: Check balance
echo -e "\n${YELLOW}💰 Step 3: Checking balance...${NC}"
BALANCE=$(solana balance --url $CLUSTER)
echo "Current balance: $BALANCE"

if [ "$BALANCE" == "0 SOL" ]; then
    echo "Requesting airdrop..."
    solana airdrop 2 --url $CLUSTER
    echo "✅ Airdrop received"
fi

# Step 4: Build program
echo -e "\n${YELLOW}🔨 Step 4: Building program...${NC}"
anchor build
echo "✅ Program built"

# Step 5: Deploy
echo -e "\n${YELLOW}📦 Step 5: Deploying to $CLUSTER...${NC}"
anchor deploy --provider.cluster $CLUSTER
echo "✅ Program deployed"

# Step 6: Export IDL
echo -e "\n${YELLOW}📄 Step 6: Exporting IDL...${NC}"
cp target/idl/ginva.json ./ginva.json
echo "✅ IDL exported"

# Step 7: Verify deployment
echo -e "\n${YELLOW}✅ Step 7: Verifying deployment...${NC}"
DEPLOYED_ID=$(solana program show $PROGRAM_ID --url $CLUSTER | grep "Program address" | awk '{print $3}')
if [ "$DEPLOYED_ID" == "$PROGRAM_ID" ]; then
    echo "✅ Program verified on chain"
else
    echo -e "${RED}❌ Program verification failed${NC}"
    exit 1
fi

# Summary
echo -e "\n${GREEN}=========================================="
echo -e "🎉 Deployment Complete!"
echo -e "==========================================${NC}"
echo "Program ID: $PROGRAM_ID"
echo "Network: $CLUSTER"
echo "Wallet: $WALLET_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Run: ts-node scripts/setup-devnet.ts"
echo "  2. Test: anchor test"
echo ""
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=$CLUSTER"
