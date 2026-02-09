# 🤖 GINVA Keeper Bot Suite

Automated keeper bots for the GINVA Protocol - The On-Chain Distressed Asset Exchange.

## 🎯 Features

### 1. 🔨 Trigger Keeper Bot (Keeper A)

- Monitors all active loans for liquidatable positions
- Automatically triggers liquidation when health factor drops
- Earns 0.6% reward on successful triggers
- Configurable minimum profit thresholds

### 2. 🏪 Storefront Hunter Bot (Keeper B)

- Watches the Pawn Shop for discounted assets
- Time-decay pricing strategy (8% → 6% → 3% → 0%)
- Competitive buying with priority fees
- Real-time FOMO-based purchasing

### 3. ✨ Finalize Keeper Bot (Keeper C)

- Monitors swapped liquidations
- Finalizes distribution to complete the cycle
- Earns fixed 1.0 USDC reward per finalization
- Ensures protocol solvency

## 🚀 Quick Start

### Installation

```bash
cd bots
npm install
```

### Configuration

Create `.env` file:

```env
# RPC Configuration
RPC_URL=https://api.devnet.solana.com

# Program ID
PROGRAM_ID=DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv

# Wallet (Place your keypair.json in bots folder)
KEYPAIR_PATH=./keypair.json

# IDL Path (adjust if needed)
IDL_PATH=../target/idl/ginva.json
```

### Fund Your Bot Wallet

```bash
# Request airdrop on devnet
solana airdrop 2 <YOUR_BOT_WALLET_ADDRESS> --url devnet
```

## 📖 Usage

### Run All Bots

```bash
npm start
# or
npm run start
```

### Run Individual Bots

```bash
# Trigger Bot only
npm run start:trigger

# Hunter Bot only
npm run start:hunter

# Finalize Bot only
npm run start:finalize
```

## ⚙️ Configuration Options

Edit the `CONFIG` object in `keeper-suite.ts`:

```typescript
const CONFIG = {
  // Trigger Bot Settings
  trigger: {
    enabled: true,
    minProfit: 0.5, // Minimum USDC profit to trigger
    checkInterval: 5000, // Check every 5 seconds
    maxConcurrent: 3, // Max simultaneous liquidations
  },

  // Hunter Bot Settings
  hunter: {
    enabled: true,
    minDiscount: 6, // Min discount % to buy
    maxDiscount: 8, // Max discount % (safety)
    checkInterval: 2000, // Check every 2 seconds
    maxInvestment: 10000, // Max USDC per deal
  },

  // Finalize Bot Settings
  finalize: {
    enabled: true,
    checkInterval: 10000, // Check every 10 seconds
    minProfit: 1.0, // Minimum 1.0 USDC reward
  },

  // General
  priorityFee: 10000, // Micro-lamports for priority
  commitment: "confirmed",
};
```

## 🎨 Bot Behaviors

### Trigger Bot

- **Monitors**: All active loans every 5 seconds
- **Criteria**: Health factor < 100% OR overdue > 33 days
- **Action**: Calls `trigger_liquidation()`
- **Reward**: 0.6% of collateral amount
- **Gas**: Uses priority fees for competitive advantage

### Hunter Bot

- **Monitors**: Triggered but not swapped liquidations
- **Strategy**:
  - Golden Hour (0-10 min): Buy at 8% discount
  - Silver Tier (10-30 min): Buy at 6% discount
  - Bronze Tier (30-60 min): Buy at 3% discount
- **Risk Management**:
  - Only buys within configured discount range
  - Maximum investment limit per deal
  - Creates token accounts automatically
- **Profit**: Instant arbitrage from discount

### Finalize Bot

- **Monitors**: Swapped but not finalized liquidations
- **Criteria**: Deadline not yet reached
- **Action**: Calls `finalize_liquidation()`
- **Reward**: Fixed 1.0 USDC per finalization
- **Safety**: Checks all prerequisites before finalizing

## 📊 Expected Profits

### Example Scenarios

**Trigger Bot:**

- Liquidate 1000 USDC collateral → Earn 6 USDC (0.6%)
- Liquidate 10,000 USDC collateral → Earn 60 USDC

**Hunter Bot:**

- Buy 1000 USDC asset at 8% discount → Save 80 USDC
- Buy 5000 USDC asset at 6% discount → Save 300 USDC

**Finalize Bot:**

- Each finalization → Earn 1.0 USDC
- Process 100 finalizations/day → Earn 100 USDC/day

## 🔒 Security Considerations

1. **Private Key Safety**: Never commit your keypair.json
2. **RPC Reliability**: Use dedicated RPC for production
3. **Rate Limiting**: Built-in rate limiting to avoid RPC bans
4. **Error Handling**: Comprehensive error handling and recovery
5. **Monitoring**: Console logs for all activities

## 🐛 Troubleshooting

### "Insufficient funds"

- Make sure your wallet has SOL for transaction fees
- Request airdrop: `solana airdrop 2 <ADDRESS> --url devnet`

### "Account not found"

- Ensure IDL path is correct
- Check PROGRAM_ID matches deployment

### "Transaction failed"

- Check if liquidation is already in progress
- Verify you have sufficient USDC for hunter bot

## 📈 Performance Tips

1. **Use Dedicated RPC**: Helius, QuickNode, or Alchemy for better performance
2. **Run 24/7**: Use PM2 or systemd for persistent operation
3. **Multiple Instances**: Run multiple bots on different machines for redundancy
4. **Monitor Logs**: Set up log aggregation for analytics

## 🤝 Contributing

To add new strategies or improve existing ones:

1. Fork the repository
2. Create a new bot class in `keeper-suite.ts`
3. Test thoroughly on devnet
4. Submit a pull request

## 📜 License

BUSL-1.1 (Business Source License)

## 🔗 Resources

- [GINVA Protocol](https://github.com/Dr-SoloDev/ginva)
- [Documentation](../docs/)
- [Discord](https://discord.gg/ginva)

---

**Happy Hunting! 🦁**

_Remember: These bots compete with others. Speed and gas optimization are key!_
