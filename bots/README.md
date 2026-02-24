# 🤖 GINVA Helper Bot Suite

> **"Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"**

Automated bots for GINVA Protocol Helpers - System Stability Guardians

## 🎯 Features

### 1. 🔨 Trigger Helper Bot (A)

- Monitor all active loans to find positions needing assistance
- Automatically trigger rescue process when account health is low
- Earn 0.6% reward when assisting successfully
- Configurable minimum profit threshold

### 2. 🏪 Storefront Hunter Bot (B)

- Monitor storefronts for discounted assets
- Time-based pricing strategy (8% → 6% → 3% → 0%)
- Competitive purchasing with speed fees
- Real-time purchasing based on opportunities

### 3. ✨ Finalize Helper Bot (C)

- Monitor completed rescues awaiting distribution
- Complete the revenue distribution process
- Earn fixed 1.0 USDC reward per assistance
- Maintain protocol stability

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
# Trigger Helper Bot only
npm run start:trigger

# Storefront Hunter Bot only
npm run start:hunter

# Finalize Helper Bot only
npm run start:finalize
```

## ⚙️ Configuration Options

Edit the `CONFIG` object in `keeper-suite.ts`:

```typescript
const CONFIG = {
  // Trigger Helper Bot configuration
  trigger: {
    enabled: true,
    minProfit: 0.5, // Minimum USDC profit to assist
    checkInterval: 5000, // Check every 5 seconds
    maxConcurrent: 3, // Maximum concurrent assists
  },

  // Storefront Hunter Bot configuration
  hunter: {
    enabled: true,
    minDiscount: 6, // Minimum discount % to buy
    maxDiscount: 8, // Maximum discount % (safety)
    checkInterval: 2000, // Check every 2 seconds
    maxInvestment: 10000, // Max USDC per deal
  },

  // Finalize Helper Bot configuration
  finalize: {
    enabled: true,
    checkInterval: 10000, // Check every 10 seconds
    minProfit: 1.0, // Minimum reward 1.0 USDC
  },

  // General
  priorityFee: 10000, // Micro-lamports for speed
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

> **"Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"**
>
> _GINVA - The Most Fair Financial Platform on Solana_

**Be a system guardian and earn rewards simultaneously! 🛡️**

_A good system needs good helpers — speed and efficiency are the key!_
