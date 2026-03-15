# GINVA Protocol - AI Agent Documentation

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust"**

---

## 📋 Project Overview

**GINVA** is a decentralized lending protocol on Solana that allows users to borrow USDC using cryptocurrency (SOL, BTC, ETH) as collateral without selling their assets.

### Core Philosophy

- **72-Hour Protection**: Give borrowers time to save their assets after maturity
- **Dual Protection System**: Maturity grace period (72h) + Immediate liquidation when Health Factor < 100%
- **3-Step Liquidation**: Split into 3 roles (Keeper A, B, C) for fair distribution
- **AI Agent Support**: Revenue share model for human owners + AI agents

### Key Parameters (Immutable)

| Parameter       | Value                  |
| --------------- | ---------------------- |
| APR             | 8% Fixed               |
| LTV Safe        | 20%                    |
| LTV Standard    | 40%                    |
| LTV Max         | 60%                    |
| Min Loan        | 1 USDC                 |
| Max Loan        | 1,000,000 USDC         |
| Keeper A Reward | 0.6% of collateral     |
| Keeper C Reward | 1 USDC per transaction |

---

## 🏗️ Architecture

### Smart Contract (Rust + Pinocchio)

```
programs/ginva-pinocchio/src/lib.rs
```

**Key Modules:**

- `initialize_system` - Protocol initialization
- `deposit_collateral` - Deposit crypto as collateral
- `borrow_usdc` - Borrow USDC against collateral
- `extend_loan` - Extend loan duration
- `repay_loan` - Repay USDC to redeem collateral
- `liquidate_by_maturity` - Liquidation after 72h grace period
- `liquidate_by_health_factor` - Immediate liquidation when HF < 100%

### Frontend (React + TypeScript)

```
app/src/
├── pages/           # Landing, Borrow, Earn, Pawn, Redeem, etc.
├── components/      # Reusable UI components
├── hooks/           # Custom hooks (useWalletBalance, useGinvaProgram)
├── services/        # Queries and mutations
├── context/         # WalletContext
└── types/           # TypeScript definitions
```

### Keeper Bots (TypeScript)

```
bots/
├── keeper-a.ts     # Trigger bot (0.6% reward)
├── keeper-b.ts     # Hunter bot (buy at discount)
├── keeper-c.ts     # Finalize bot (1 USDC reward)
└── keeper-suite.ts # Unified bot suite
```

---

## 🔧 Development Setup

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL "https://release.solana.com/v1.18.4/install.sh")"

# Install Anchor (for deployment only - program now uses Pinocchio)
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli

# Install Node.js 18+
nvm install 18
```

> **Note:** The smart contract has been migrated from Anchor to [Pinocchio](https://github.com/anza-xyz/pinocchio) (a no-std Solana program library). Thanks to [anza-xyz](https://github.com/anza-xyz) for the library!

### Running Locally

```bash
# 1. Start local Solana cluster
solana-test-validator

# 2. Build the program (Pinocchio)
cd programs/ginva-pinocchio
cargo build --release

# 3. Deploy to localnet (using Solana CLI)
solana program deploy target/release/libginva_pinocchio.so

# 4. Run tests
cargo test

# 5. Start frontend
cd ../../app && npm install && npm run dev
```

### Environment Variables

```bash
# app/.env
VITE_RPC_URL=http://localhost:8899
VITE_PROGRAM_ID=GWcQGdrSiVk8p58bYSmw8FTceR9dcHAKQzw7yEyjLTsy
```

---

## 📡 Smart Contract API

### Core Functions

```rust
// Initialize Protocol
pub fn initialize_system(ctx: Context<InitializeSystem>, deposit_fee_bps: u16) -> Result<()>

// Deposit Collateral (SOL, BTC, ETH)
pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()>

// Borrow USDC
pub fn borrow_usdc(
    ctx: Context<BorrowUsdc>,
    loan_id: u32,
    ltv_option: u8,    // 1=Safe(20%), 2=Standard(40%), 3=Max(60%)
    duration_days: u16
) -> Result<()>

// Extend Loan (every 30 days)
pub fn extend_loan(ctx: Context<ExtendLoan>) -> Result<()>

// Repay Loan & Get Collateral Back
pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()>

// Trigger Liquidation (by maturity - 72h grace)
pub fn liquidate_by_maturity(ctx: Context<LiquidateByMaturity>) -> Result<()>

// Trigger Liquidation (immediate when HF < 100%)
pub fn liquidate_by_health_factor(ctx: Context<LiquidateByHealthFactor>) -> Result<()>
```

### Admin Functions

```rust
// Emergency Controls
pub fn emergency_pause(ctx: Context<AdminOnly>) -> Result<()>
pub fn emergency_resume(ctx: Context<AdminOnly>) -> Result<()>

// Update Protocol Config
pub fn update_protocol_config(
    ctx: Context<UpdateProtocolConfig>,
    new_timeout: Option<i64>,
    new_swap_reward_bps: Option<u64>,
    new_distribute_reward_bps: Option<u64>,
    new_min_loan: Option<u64>,
    new_max_loan: Option<u64>
) -> Result<()>
```

### Keeper Agent Functions

```rust
// Register AI Keeper Agent
pub fn register_keeper_agent(
    ctx: Context<RegisterKeeperAgent>,
    agent_id: u64,
    keeper_type: u8,  // 1=Trigger, 2=Swap, 3=Finalize
    owner_share_bps: u16,
    agent_share_bps: u16
) -> Result<()>

// Execute Keeper Task & Earn Rewards
pub fn execute_keeper_task(
    ctx: Context<ExecuteKeeperTask>,
    reward_amount: u64,
    task_success: bool
) -> Result<()>

// Claim Earnings (Owner Share)
pub fn claim_keeper_earnings(ctx: Context<ClaimKeeperEarnings>) -> Result<()>
```

---

## 🔐 Security Features

### Implemented Protections

1. **Reentrancy Guards** - Prevents repeat attacks
2. **Flash Loan Protection** - Minimum 5-minute hold period
3. **Rate Limiting** - Max 5 operations per block
4. **Oracle Circuit Breaker** - Pauses if Pyth oracle fails 3 times
5. **Emergency Pause** - Admin can pause in emergencies
6. **Timelock** - 48h delay after resume before operations resume
7. **Price Validation** - Max 15 seconds stale, max 1% confidence ratio

### Important Notes

- **Interest Rate (8%) and LTV (20/40/60%) are IMMUTABLE** - Cannot be changed by admin
- **Deposit Fee** - Configurable by admin (default varies)
- **Only admin can pause** - But anyone can resume after timelock

---

## 🤖 AI Agent Integration

### Revenue Share Model

```
Total Rewards: 100%
├── 45% → Human Owner
├── 35% → AI Agent (for operations)
└── 20% → Protocol
```

### Keeper Agent Registration

```rust
// Agent can register with custom revenue split
register_keeper_agent(
    agent_id: 1,
    keeper_type: 1,        // 1=Trigger, 2=Swap, 3=Finalize
    owner_share_bps: 4500, // 45%
    agent_share_bps: 3500  // 35%
)
```

### Running Keeper Bots

```bash
cd bots
npm install

# Configure .env
cp .env.example .env
# Edit RPC_URL, PROGRAM_ID, KEYPAIR_PATH

# Run all bots
npm start

# Or run individually
npm run start:trigger   # Keeper A
npm run start:hunter     # Keeper B
npm run start:finalize  # Keeper C
```

---

## 🧪 Testing

### Run Tests

```bash
# Pinocchio Rust unit tests
cd programs/ginva-pinocchio
cargo test

# TypeScript integration tests (requires local validator)
solana-test-validator &
npm run test:integration
```

### Test Categories

| Test File                       | Coverage               |
| ------------------------------- | ---------------------- |
| `ginva.ts`                      | Core lending functions |
| `liquidation-lock.test.ts`      | Liquidation mechanics  |
| `reentrancy-protection.test.ts` | Security               |
| `keeper-operations.test.ts`     | Keeper bots            |
| `circuit-breaker.test.ts`       | Oracle safety          |
| `agent-registration.test.ts`    | AI Agent registration  |

---

## 📁 Key Files

| File                                  | Description                 |
| ------------------------------------- | --------------------------- |
| `programs/ginva-pinocchio/src/lib.rs` | Main smart contract         |
| `app/src/lib/ginvaProgram.ts`         | Frontend contract interface |
| `app/src/idl/ginva.json`              | Contract IDL                |
| `Cargo.toml`                          | Pinocchio configuration     |
| `tests/ginva.ts`                      | Integration tests           |
| `bots/keeper-suite.ts`                | Keeper bot implementation   |

---

## 🚀 Deployment

### Networks

| Network   | Program ID                                     | RPC                            |
| --------- | ---------------------------------------------- | ------------------------------ |
| Localhost | Generated on deploy                            | http://localhost:8899          |
| Devnet    | `GWcQGdrSiVk8p58bYSmw8FTceR9dcHAKQzw7yEyjLTsy` | https://api.devnet.solana.com  |
| Mainnet   | TBD                                            | https://api.mainnet.solana.com |

### Deploy Commands

```bash
# Build Pinocchio program first
cd programs/ginva-pinocchio
cargo build --release

# Devnet
solana program deploy target/release/libginva_pinocchio.so

# Mainnet (requires SOL for fees)
solana program deploy target/release/libginva_pinocchio.so --url mainnet
```

---

## 📞 Common Issues

### "Error: Account not found"

- Verify the program is deployed: `solana program show <PROGRAM_ID>`
- Check frontend has correct PROGRAM_ID in environment

### "Error: Insufficient funds"

- Request airdrop: `solana airdrop 2 <ADDRESS> --url devnet`

### "Error: Transaction failed"

- Check if protocol is paused: `emergency_pause` may be active
- Verify wallet has enough SOL for fees

---

## 🔗 Resources

- [Documentation](./docs/)
- [Vision](./docs/VISION.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [Keeper Bot Guide](./bots/README.md)

---

> **Note for AI Agents**: This is a real DeFi protocol handling real assets. Always prioritize security and test thoroughly before any transaction.
