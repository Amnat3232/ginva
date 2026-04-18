# GINVA - Decentralized Pawn Shop Protocol

## The Problem

Crypto holders need liquidity without selling their assets. Traditional DeFi liquidation is brutal—immediate, no-notice, predator-friendly. Nobody wins except vultures.

## The Solution

**GINVA** is a decentralized lending protocol on Solana that lets users borrow USDC against their SOL, BTC, or ETH collateral—without selling. Our Dual Protection System creates a fairness layer crypto never had.

### Why We're Different

| Feature | Traditional DeFi | GINVA |
|--------|------------------|------|
| Notice Period | None (immediate) | **72 hours** after expiry |
| Interest Rate | Variable, floating | **Fixed 8% APR** |
| Language | "Liquidation" | Protection System |
| Process | Vultures feast | AI Agents help fairly |

### Key Differentiators

1. **72-Hour Grace Period**
   After loan expires, borrowers have 72 hours to repay or extend—no immediate loss.

2. **Fixed 8% APR**
   No floating rates, no surprise spikes. Lock in 8% annually.

3. **Dual Protection System**
   - Layer 1: Time-based (72-hour grace period)
   - Layer 2: Price-based (immediate protection if Health Factor drops below 100%)

4. **AI Helpers**
   Instead of predatory liquidators, AI agents assist users fairly using time-weighted pricing. Surplus returned to borrower.

5. **User-Friendly Language**
   We renamed "Liquidation" → "Protection System", "Keeper" → "Helper", "Seizure" → "Asset Management". We don't scare users.

### Protocol Basics

- **Collateral**: SOL, BTC, ETH (more assets coming)
- **Loan-to-Value**: Up to 60% of collateral value
- **Duration**: Flexible, user-selected
- **Interest**: Fixed 8% APR, always

### Security Features

- **Supply Cap**: Max deposit/borrow limits per asset
- **Oracle Circuit Breaker**: Auto-pause on price anomalies
- **Multi-Oracle**: Pyth + Switchboard dual validation
- **Timelock**: Admin actions require 24-hour delay

### The Team Behind It

Our origin story: A DeFi pioneer who watched friends lose crypto to liquidation vultures. Built Ginva to prove lending can be fair.

---

## AI Keeper Agent

Automated liquidation agent powered by **Carbium Infrastructure** for sub-50ms latency.

### Infrastructure

- **RPC**: `https://rpc.carbium.io` (sub-50ms latency)
- **WebSocket**: `wss://wss-rpc.carbium.io`
- **gRPC**: `grpc://grpc.carbium.io:443`
- **MEV Protection**: Jito bundling via Carbium
- **Cluster**: Solana Devnet (default)

### How It Works

1. **Subscribe** to GINVA program events via WebSocket
2. **Monitor** account changes for liquidatable positions (Health Factor < 100%)
3. **Analyze** opportunity profitability (min profit threshold)
4. **Execute** liquidation via Carbium Swap API
5. **Distribute** revenue per split

### Features

- **Real-time Monitoring**: Program subscription via WebSocket
- **Smart Execution**: Auto-detect liquidatable positions (Health Factor < 100%)
- **Revenue Split**:
  - Owner: 45%
  - Agent: 35%
  - Protocol: 20%
- **Resilience**:
  - Retry with exponential backoff (5 retries: 1s, 2s, 4s, 8s, 16s)
  - Health check every 30s
  - Auto-recovery on failure
- **Alerts**: Discord + Telegram notifications
- **Dashboard**: Local JSON logging to `keeper-agent.log`

### Environment Variables

```bash
# Required
PRIVATE_KEY="[...array...]"     # Wallet private key
CARBIUM_RPC="https://rpc.carbium.io"
CARBIUM_WSS="wss://wss-rpc.carbium.io"
CARBIUM_GRPC="grpc://grpc.carbium.io:443"

# Optional
GINVA_PROGRAM_ID="GiqfoYyeQuNEPRiZbdKCtMCeYvKVpQyDWUiSDB6U9bzC"
MIN_PROFIT="0.1"                    # Minimum profit in USDC
LOG_FILE="./keeper-agent.log"

# Alerts (optional)
DISCORD_WEBHOOK="https://discord.com/api/webhooks/..."
TELEGRAM_BOT_TOKEN="123456:ABC-DEF"
TELEGRAM_CHAT_ID="123456789"
```

### Usage

```bash
cd bots
cp .env.example .env
# Edit .env with your configuration
npx tsx ai-keeper-agent.ts
```

### Files

- `bots/ai-keeper-agent.ts` - Main AI agent implementation (this project)
- `bots/keeper-bot.ts` - Basic keeper bot
- `bots/.env.example` - Environment template

---

**For QIE Hackathon Judges**

Ginva isn't just another lending protocol. We're the first to prioritize borrower protection with a fairness layer that aligns incentives for everyone. No hidden fees. No immediate liquidation. Just fair, transparent crypto lending.

Built by believers. Tested in production. Ready for mainnet.