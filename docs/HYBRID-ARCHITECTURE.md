# GINVA Hybrid Architecture
## Cloudflare Agents + Solana Program

> "ล่าง: Code is Law (Solana)
> บน: Real-time Intelligence (Cloudflare Agents)"

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GINVA HYBRID                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │   USER INTERFACE │      │  CLOUDFLARE      │               │
│  │   (Web/Mobile)   │      │  AGENTS LAYER    │               │
│  └────────┬─────────┘      └────────┬─────────┘               │
│           │                          │                          │
│           │  ┌──────────────────────┴──────────┐              │
│           │  │      GINVA AGENTS               │              │
│           │  ├───────────────────────────────  │              │
│           │  │ 🛡️ Guardian Agents             │              │
│           │  │ • เฝ้าตลอด 24/7                 │              │
│           │  │ • เช็ค health ทุก 30 วินาที      │              │
│           │  │ • WebSocket notification        │              │
│           │  │                                 │              │
│           │  │ 📊 Dashboard Agent              │              │
│           │  │ • Real-time position status     │              │
│           │  │ • Graph visualization           │              │
│           │  │ • User preferences              │              │
│           │  │                                 │              │
│           │  │ 💬 Notification Agent           │              │
│           │  │ • Email/SMS alerts              │              │
│           │  │ • Push notifications            │              │
│           │  │ • Telegram bot integration      │              │
│           │  │                                 │              │
│           │  │ 💰 Fee Collector Agent          │              │
│           │  │ • Collect protocol fees         │              │
│           │  │ • Distribute to Agent holders   │              │
│           │  │ • x402 payment integration      │              │
│           │  └─────────────────────────────────┘              │
│           │                          │                         │
│           │                          │ RPC/Wallet              │
│           ▼                          ▼                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   SOLANA PROGRAM LAYER                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │   📜 GINVA CORE (On-chain)                              │  │
│  │   ├─ Deposit / Borrow / Repay                           │  │
│  │   ├─ Liquidation Logic                                  │  │
│  │   ├─ Interest Calculation                               │  │
│  │   ├─ Position Management                                │  │
│  │   └─ Guardian Registry                                  │  │
│  │                                                          │  │
│  │   🪙 TOKEN PROGRAM                                       │  │
│  │   ├─ gTOKEN (Governance/Reward)                         │  │
│  │   └─ USDC (Borrowing)                                   │  │
│  │                                                          │  │
│  │   🔮 ORACLES                                             │  │
│  │   ├─ Pyth (Price feeds)                                 │  │
│  │   └─ Switchboard (Backup)                               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Cloudflare Agents Specifications

### 1. Guardian Agent

```typescript
// src/agents/guardian.ts
import { Agent, callable, state } from 'agents';

interface Position {
  user: string;
  collateral: number;
  borrowed: number;
  healthFactor: number;
  lastUpdate: number;
}

export class GuardianAgent extends Agent {
  @state positions: Map<string, Position> = new Map();

  // เช็คทุก 30 วินาที
  @callable
  async checkHealth(address: string): Promise<{
    status: 'safe' | 'warning' | 'critical';
    healthFactor: number;
    recommendation: string;
  }> {
    const position = this.positions.get(address);
    if (!position) return { status: 'safe', healthFactor: 100, recommendation: 'No position' };

    if (position.healthFactor >= 1.5) {
      return { status: 'safe', healthFactor: position.healthFactor, recommendation: 'Position healthy' };
    } else if (position.healthFactor >= 1.2) {
      return { status: 'warning', healthFactor: position.healthFactor, recommendation: 'Consider adding collateral' };
    } else {
      return { status: 'critical', healthFactor: position.healthFactor, recommendation: 'Add collateral or repay NOW' };
    }
  }

  // ส่ง notification ผ่าน WebSocket
  @callable
  async notifyUser(address: string, message: string): Promise<void> {
    // Broadcast to connected clients
    this.broadcast({ type: 'alert', address, message });
  }
}
```

### 2. Dashboard Agent

```typescript
// src/agents/dashboard.ts
import { Agent, callable, state, useAgentChat } from 'agents';

export class DashboardAgent extends Agent {
  @state userPositions: Map<string, PositionData> = new Map();
  @state systemStats: SystemStats = {
    totalCollateral: 0,
    totalBorrowed: 0,
    activePositions: 0,
    guardianCount: 0,
  };

  @callable
  async getUserDashboard(user: string): Promise<DashboardData> {
    const position = this.userPositions.get(user);
    const agentInfo = await this.getGuardianInfo(user);

    return {
      position: position || null,
      guardian: agentInfo,
      system: this.systemStats,
      notifications: await this.getUnreadNotifications(user),
    };
  }

  // Real-time streaming
  @callable
  async subscribeToUpdates(user: string): Promise<AsyncIterable<Update>> {
    return this.subscribe(`user:${user}`);
  }
}
```

### 3. Notification Agent

```typescript
// src/agents/notification.ts
import { Agent, callable, schedule } from 'agents';
import { EmailRouter } from './email';
import { TelegramBot } from './telegram';

export class NotificationAgent extends Agent {
  @callable
  async sendAlert(params: {
    userId: string;
    type: 'health_warning' | 'liquidation' | 'repayment_due';
    channel: 'email' | 'telegram' | 'push';
    data: any;
  }): Promise<{ success: boolean }> {
    const templates = {
      health_warning: (d) => `⚠️ Warning: Your health factor is ${d.healthFactor}. Add collateral to stay safe.`,
      liquidation: (d) => `🛡️ Your position is being liquidated. You have 72h grace period.`,
      repayment_due: (d) => `⏰ Reminder: Your loan matures in ${d.days} days.`,
    };

    const message = templates[params.type](params.data);

    switch (params.channel) {
      case 'email':
        return await EmailRouter.send(params.userId, message);
      case 'telegram':
        return await TelegramBot.send(params.userId, message);
      default:
        return { success: false };
    }
  }

  // Daily summary
  @schedule('0 9 * * *') // 9 AM daily
  async sendDailySummary(): Promise<void> {
    // Send summary to all active users
  }
}
```

---

## 🔗 Connection: Cloudflare ↔ Solana

### Option 1: Direct RPC (Recommended for MVP)

```typescript
// src/lib/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC!);

export async function getPosition(user: PublicKey) {
  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), user.toBuffer()],
    GINVA_PROGRAM_ID
  );

  const account = await connection.getAccountInfo(positionPda);
  if (!account) return null;

  return Position.deserialize(account.data);
}
```

### Option 2: WebSocket Subscription

```typescript
// ติดตาม on-chain changes แบบ real-time
import { connection } from './solana';

connection.onProgramAccountChange(
  GINVA_PROGRAM_ID,
  (updated) => {
    // Update Cloudflare Agent state
    guardianAgent.updatePosition(updated.pubkey, updated.account);
  },
  'processed'
);
```

---

## 💰 x402 Payment Integration

```typescript
// src/agents/fee-collector.ts
import { Agent, callable } from 'agents';

export class FeeCollectorAgent extends Agent {
  @callable
  @requirePayment(0.01) // $0.01 per call
  async generateReport(user: string, period: string): Promise<Report> {
    // รายงานที่ต้องจ่ายถึงดูได้
  }

  @callable
  async mintGuardian(nftData: GuardianNFT): Promise<{ mint: string }> {
    // ซื้อ Guardian Agent NFT
    // รับ payment ผ่าน x402
    const payment = await this.requirePayment(0.1); // 0.1 USDC
    await payment.complete();
    return { mint: await mintNFT(nftData) };
  }
}
```

---

## 🚀 Deployment

### 1. Deploy Solana Program (ล่าง)

```bash
cd programs/ginva-pinocchio
cargo build-bpf
solana program deploy ./target/deploy/ginva_pinocchio.so
```

### 2. Deploy Cloudflare Agents (บน)

```bash
# สร้าง project ใหม่
npm create cloudflare@latest -- --template cloudflare/agents-starter ginva-agents

# Deploy
npx wrangler deploy
```

### 3. Environment Variables

```bash
# .dev.vars
SOLANA_RPC=https://api.mainnet-beta.solana.com
SOLANA_WSS=wss://api.mainnet-beta.solana.com
GINVA_PROGRAM_ID=your_program_id
PYTH_RPC=https://pyth-data-rpc.properties
```

---

## 📊 Cost Estimation

| Component | Free Tier | Paid (if needed) |
|-----------|-----------|------------------|
| Solana RPC (Helius) | 10K requests/day | $25+/month |
| Cloudflare Workers | 100K/day | $5/100K |
| Cloudflare Durable Objects | 50K ops/day | $0.20/100K |
| Cloudflare DB (D1) | 1GB | $5/GB |
| Cloudflare R2 (storage) | 1GB | $0.015/GB |

**Total for MVP**: ~$0 (all free tiers combined)

---

## 🛡️ Security Considerations

```typescript
// ตรวจสอบว่า user เป็นเจ้าของ wallet จริง
async function verifyOwnership(
  userAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = base58.decode(signature);
  const publicKey = new PublicKey(userAddress);

  return await Ed25519Program.verify({
    message: messageBytes,
    signature: signatureBytes,
    publicKey: publicKey,
  });
}
```

---

## 📋 Todo List

- [ ] Set up Cloudflare Workers project
- [ ] Create Guardian Agent template
- [ ] Create Dashboard Agent template
- [ ] Create Notification Agent template
- [ ] Set up Solana RPC connection
- [ ] Implement WebSocket subscription
- [ ] Add x402 payment for premium features
- [ ] Deploy to Cloudflare
- [ ] Test on devnet
- [ ] Deploy to mainnet

---

*Last updated: 2026-04-26*
*Architecture: Hybrid - Cloudflare Agents (intelligence) + Solana (trust)*