# GINVA Guardian Agent 🛡️

> "ทหารยามเฝ้าประตู เป็นปราการปกป้องโปรโตคอล"

A Cloudflare Agents powered Guardian that monitors GINVA positions 24/7, checks health factors, and sends alerts to users.

## Features

- ✅ **24/7 Monitoring** - Continuously watches all registered positions
- ✅ **Health Check** - Calculates and monitors health factors
- ✅ **Alert System** - Warns users before liquidation
- ✅ **72h Grace Period** - Tracks grace period for users
- ✅ **Real-time Notifications** - Sends alerts via multiple channels
- ✅ **Statistics** - Tracks warning/critical/emergency counts
- ✅ **Scheduled Checks** - Automatically checks every minute

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Configuration

Set environment variables in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
GINVA_PROGRAM_ID = "your_program_id"
SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
```

## API Endpoints

### Register Position
```typescript
// POST /guardian/register
{
  "userAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "collateralAmount": 1000000000,
  "collateralMint": "So11111111111111111111111111111111111111112",
  "borrowedAmount": 50000000,
  "healthFactor": 1.5,
  "liquidationThreshold": 1.2,
  "isActive": true,
  "gracePeriodEnd": 1750000000000
}
```

### Check Health
```typescript
// GET /guardian/health?address=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
{
  "status": "healthy", // "healthy" | "warning" | "critical" | "emergency"
  "healthFactor": 1.5,
  "recommendation": "Your position is safe.",
  "position": { ... }
}
```

### Get Stats
```typescript
// GET /guardian/stats
{
  "totalWatched": 150,
  "warnings": 12,
  "criticals": 3,
  "emergencies": 0,
  "lastCheck": 1750000000000
}
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           GINVA GUARDIAN AGENT              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Position Registry                  │   │
│  │  - Map<address, Position>           │   │
│  │  - Active monitoring                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Health Checker                     │   │
│  │  - Warning: HF < 1.3                │   │
│  │  - Critical: HF < 1.1               │   │
│  │  - Emergency: HF < 1.0              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Alert System                       │   │
│  │  - Queue notifications              │   │
│  │  - Broadcast emergencies            │   │
│  │  - Track acknowledgment             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Scheduler                          │   │
│  │  - Every minute: check all          │   │
│  │  - Every hour: deep analysis        │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Health Factor Thresholds

| Status | Health Factor | Action |
|--------|---------------|--------|
| 🟢 Healthy | ≥ 1.3 | No action needed |
| 🟡 Warning | 1.1 - 1.3 | Suggest adding collateral |
| 🔴 Critical | 1.0 - 1.1 | URGENT: 72h grace period |
| ⚫ Emergency | < 1.0 | Imminent liquidation |

## Integration with Solana

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL!);

async function fetchPositionFromChain(userAddress: string) {
  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), new PublicKey(userAddress).toBuffer()],
    new PublicKey(process.env.GINVA_PROGRAM_ID!)
  );

  const account = await connection.getAccountInfo(positionPda);
  // Decode and return position data
}
```

## Development

```bash
# Run tests
npm test

# Type check
npm run build

# Watch mode
npm run dev -- --port 8787
```

## Environment

- **Cloudflare Workers** - Runtime
- **Durable Objects** - State management
- **Wrangler** - CLI tool

## License

BUSL-1.1

---

*Built with ❤️ by Dr-SoloDev*
*"Code is Law. Soul is Proof."*