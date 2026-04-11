# GINVA AI Agent Keeper SDK Manual

## Table of Contents
1. [Protocol Overview](#1-protocol-overview)
2. [Program ID & Networks](#2-program-id--networks)
3. [Account Structures](#3-account-structures)
4. [Instructions](#4-instructions)
5. [Error Codes](#5-error-codes)
6. [AI Agent Integration Guide](#6-ai-agent-integration-guide)
7. [Code Examples](#7-code-examples)

---

## 1. Protocol Overview

**GINVA** is a decentralized lending protocol on Solana that lets users borrow USDC against their SOL, BTC, or ETH collateral without selling their assets.

### Key Features

| Feature | Description |
|---------|-------------|
| **Grace Period** | 72 hours after loan maturity before liquidation |
| **Fixed APR** | 8% APR (no floating rates) |
| **Dual Protection** | Time-based + Price-based protection |
| **AI Agent Keepers** | AI agents help borrowers fairly instead of predatory liquidators |

### AI Agent Keeper Role

AI Agents ("Helpers") can:
- Monitor loans in grace period
- Help borrowers repay before liquidation
- Execute fair liquidations after grace period
- Earn revenue from protection services

---

## 2. Program ID & Networks

### ginva-pinocchio (No-Std Version)

| Network | Program ID |
|---------|------------|
| Devnet | `BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH` |

---

## 3. Account Structures

### 3.1 System Config (`SYSTEM_CONFIG_SIZE: 285 bytes`)

```rust
pub struct SystemConfig {
    pub discriminator: [u8; 8],        // b"config__"
    pub admin: [u8; 32],              // Admin public key
    pub capital_wallet_authority: [u8; 32],
    pub vault_wallet_authority: [u8; 32],
    pub revenue_wallet_authority: [u8; 32],
    pub seized_assets_authority: [u8; 32],
    pub collateral_mint: [u8; 32],       // Collateral token mint (e.g., SOL)
    pub loan_mint: [u8; 32],           // Loan token mint (e.g., USDC)
    pub deposit_fee_bps: u16,           // Deposit fee in basis points
    pub is_active: u8,                // 1 = active, 0 = paused
    pub total_borrowed: u64,           // Total borrowed amount
    pub total_collateral: u64,        // Total collateral deposited
    pub ops_wallet: [u8; 32],         // Operations wallet
    pub total_staked: u64,            // Total staked for agents
    pub acc_reward_per_share: u128,   // Accumulated rewards
    pub is_paused: u8,               // Emergency pause flag
    pub pause_reason: [u8; 50],        // Pause reason
}
```

**Key Methods:**
- `is_active()` - Returns true if protocol is active and not paused
- `is_paused()` - Returns true if protocol is paused
- `admin()` - Returns admin public key

### 3.2 Asset Config (`ASSET_CONFIG_SIZE: 246 bytes`)

```rust
pub struct AssetConfig {
    pub discriminator: [u8; 8],           // b"asset___"
    pub asset_id: [u8; 32],
    pub mint: [u8; 32],
    pub reserve_wallet: [u8; 32],
    pub debt_share_mint: [u8; 32],
    pub total_reserve: u64,
    pub utilization_ratio_bps: u16,
    pub interest_rate_bps: u16,
    pub max_ltv_bps: u16,
    pub liquidation_threshold_bps: u16,
    pub is_active: u8,
    pub supply_cap: u64,
    pub circuit_breaker_triggered: u8,
    // ... more fields
}
```

**Key Methods:**
- `is_active()` - Returns true if asset is enabled
- `circuit_breaker_triggered()` - Returns true if circuit breaker is active
- `is_supply_cap_exceeded(amount)` - Check if borrowing would exceed supply cap

### 3.3 Loan Account (`LOAN_ACCOUNT_SIZE: ~215 bytes`)

```rust
pub struct LoanAccount {
    pub discriminator: [u8; 8],       // b"loanac01"
    pub loan_id: [u8; 32],
    pub borrower: [u8; 32],
    pub status: u8,                    // 0=inactive, 1=active, 2=liquidated
    pub collateral_amount: u64,
    pub loan_amount: u64,
    pub cumulative_interest: u64,
    pub loan_start_time: u64,
    pub loan_maturity_time: u64,       // Unix timestamp when loan matures
    pub is_liquidated: u8,
    pub liquidation_processed: u8,
    pub debt_accumulated: u128,
    pub is_initialized: u8,
    pub asset_config: [u8; 32],
    // ... more fields
}
```

**Key Methods - Grace Period:**

```rust
impl LoanAccount {
    /// Check if loan has reached maturity
    pub fn is_matured(&self, current_time: u64) -> bool {
        current_time >= self.loan_maturity_time
    }

    /// Check if loan is in 72-hour grace period after maturity
    /// During grace period, loan cannot be liquidated by maturity
    pub fn is_in_grace_period(&self, current_time: u64) -> bool {
        if !self.is_matured(current_time) {
            return false;
        }
        // Grace period = 72 hours = 259200 seconds
        let grace_period: i64 = 72 * 60 * 60;
        let maturity_time = self.loan_maturity_time as i64;
        let current = current_time as i64;
        current < maturity_time + grace_period
    }

    /// Check if loan can be liquidated by maturity (after grace period)
    pub fn can_liquidate_by_maturity(&self, current_time: u64) -> bool {
        if !self.is_matured(current_time) {
            return false;
        }
        let grace_period: i64 = 72 * 60 * 60;
        let maturity_time = self.loan_maturity_time as i64;
        let current = current_time as i64;
        current >= maturity_time + grace_period
    }

    /// Get remaining grace period in seconds
    pub fn get_remaining_grace_period(&self, current_time: u64) -> i64 {
        if !self.is_matured(current_time) {
            return 72 * 60 * 60; // Full grace period
        }
        let grace_period: i64 = 72 * 60 * 60;
        let elapsed = current_time as i64 - self.loan_maturity_time as i64;
        (grace_period - elapsed).max(0)
    }
}
```

### 3.4 Agent Account (`AGENT_ACCOUNT_SIZE: ~294 bytes`)

```rust
pub struct AgentAccount {
    pub discriminator: [u8; 8],
    pub agent_id: [u8; 32],
    pub authority: [u8; 32],          // AI Agent owner
    pub status: u8,                  // Agent status
    pub staked_amount: u64,          // Staked tokens for credibility
    pub earned_rewards: u64,
    pub is_initialized: u8,
    pub is_active: u8,
    pub is_paused: u8,
    pub reward_pool: [u8; 32],
    // ... more fields
}
```

---

## 4. Instructions

### Instruction Enum

```rust
#[repr(u8)]
pub enum GinvaInstruction {
    InitializeSystem = 0,
    InitializeProtocolConfig = 1,
    InitializeAsset = 2,
    Deposit = 3,
    Borrow = 4,
    Repay = 5,
    Liquidate = 6,
    Withdraw = 7,
    StakeAgent = 8,
    UnstakeAgent = 9,
    RegisterKeeper = 10,
    KeeperHeartbeat = 11,
}
```

### 4.1 InitializeSystem (0)

Initialize the protocol configuration.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | Admin account |
| 1 | writable | system_config PDA |
| 2 | writable | protocol_config PDA |
| 3 | writable | ops_wallet (token account) |
| 4 | writable | reserve_wallet (token account) |
| 5 | readonly | collateral_mint |
| 6 | readonly | loan_mint |

**Data:** `deposit_fee_bps` (u16, le)

### 4.2 Deposit (3)

User deposits collateral into the protocol.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | User |
| 1 | writable | user_token_account |
| 2 | writable | reserve_wallet |
| 3 | readonly | system_config |
| 4 | readonly | collateral_mint |
| 5 | readonly | token_program |

**Data:** `amount` (u64, le)

### 4.3 Borrow (4)

User borrows against deposited collateral.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | Borrower |
| 1 | writable | loan_account PDA |
| 2 | writable | asset_config |
| 3 | writable | system_config |
| 4 | writable | borrower_token_account |
| 5 | readonly | collateral_mint |

**Data:** `amount` (u64, le) + `asset_id` (u64, le)

### 4.4 Repay (5)

User repays a loan.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | Payer |
| 1 | writable | loan_account |
| 2 | writable | system_config |
| 3 | writable | payer_token_account |
| 4 | writable | reserve_wallet |

**Data:** `loan_id` (u64, le) + `amount` (u64, le)

### 4.5 Liquidate (6) - **Important for AI Agents**

Liquidate an undercollateralized loan.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | Liquidator (AI Agent) |
| 1 | writable | loan_account |
| 2 | writable | asset_config |
| 3 | writable | system_config |
| 4 | writable | liquidator_collateral_account |
| 5 | writable | liquidator_repay_account |
| 6 | writable | reserve_wallet |

**Data:** `loan_id` (u64, le)

**Grace Period Logic:**
- During 72-hour grace period: Cannot liquidate by maturity, but CAN liquidate if health factor < 100%
- After grace period: Full liquidation allowed

### 4.6 StakeAgent (8)

Stake tokens to become an AI Agent.

**Data:** `agent_id` (u64, le) + `amount` (u64, le)

### 4.7 RegisterKeeper (10)

Register as a Keeper (AI Agent Helper).

**Data:** `agent_id` (u64, le) + `keeper_type` (u8)

### 4.8 KeeperHeartbeat (11)

Send heartbeat to stay active as a Keeper.

**Accounts:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | signer | Keeper |
| 1 | readonly | system_config |

---

## 5. Error Codes

### General Errors (0-99)
| Code | Name | Description |
|------|------|-------------|
| 0 | InvalidInstruction | Invalid instruction byte |
| 1 | InvalidInput | Invalid input parameters |
| 2 | InvalidAmount | Amount is zero or invalid |
| 3 | Unauthorized | Signer not authorized |
| 4 | InvalidWalletAddress | Invalid wallet address |
| 5 | ArithmeticOverflow | Math overflow |
| 6 | ArithmeticUnderflow | Math underflow |

### Protocol Errors (100-199)
| Code | Name | Description |
|------|------|-------------|
| 100 | ProtocolPaused | Protocol is paused |
| 101 | AlreadyPaused | Already paused |
| 102 | NotPaused | Not paused |
| 103 | SystemInCooldown | System in cooldown period |
| 104 | ReentrancyDetected | Reentrancy guard triggered |

### Asset Errors (200-299)
| Code | Name | Description |
|------|------|-------------|
| 200 | AssetNotActive | Asset not active |
| 201 | InvalidLTV | Invalid LTV ratio |
| 202 | InsufficientCollateral | Not enough collateral |
| 203 | InsufficientFunds | Not enough funds |

### Loan Errors (300-399)
| Code | Name | Description |
|------|------|-------------|
| 300 | LoanNotActive | Loan not active |
| 301 | LoanTooSmall | Loan below minimum |
| 302 | LoanTooLarge | Loan above maximum |
| 303 | LoanAlreadyRepaid | Loan already repaid |
| 304 | LoanNotYetMatured | Loan not matured |
| 308 | AlreadyBeingLiquidated | Already being liquidated |
| 310 | **InProtectionPeriod** | Loan in grace period (72 hours) |

### Liquidation Errors (400-499)
| Code | Name | Description |
|------|------|-------------|
| 400 | InvalidLiquidationStatus | Invalid liquidation status |
| 401 | AlreadySwapped | Already swapped |
| 402 | StorefrontPeriodNotOver | Storefront period not over |
| 403 | InvalidLiquidator | Invalid liquidator |

### Oracle Errors (500-599)
| Code | Name | Description |
|------|------|-------------|
| 500 | OraclePriceNotInitialized | Oracle price not set |
| 501 | OraclePriceTooOld | Oracle price too old |
| 502 | OracleConfidenceTooHigh | Oracle confidence too high |
| 503 | OracleCircuitBreakerTriggered | Circuit breaker triggered |
| 504 | OracleTemporarilyUnavailable | Oracle unavailable |

### Keeper/Agent Errors (600-799)
| Code | Name | Description |
|------|------|-------------|
| 600 | KeeperNotRegistered | Keeper not registered |
| 601 | KeeperAlreadyRegistered | Keeper already registered |
| 700 | AgentNotFound | Agent not found |
| 701 | AgentAlreadyExists | Agent already exists |
| 702 | AgentInactive | Agent inactive |
| 703 | AgentRateLimited | Agent rate limited |

### Security Errors (800-899)
| Code | Name | Description |
|------|------|-------------|
| 800 | SupplyCapExceeded | Supply cap exceeded |
| 801 | PriceDeviationTooHigh | Price deviation too high |
| 802 | OracleDivergenceDetected | Oracle divergence detected |
| 804 | CircuitBreakerActive | Circuit breaker active |

---

## 6. AI Agent Integration Guide

### 6.1 Agent Types

| Type | Description |
|------|-------------|
| **Monitor Agent** | Monitors loans, alerts borrowers before grace period ends |
| **Helper Agent** | Helps borrowers with repayment decisions |
| **Liquidator Agent** | Executes fair liquidations after grace period |
| **Arbitrage Agent** | Finds profitable liquidation opportunities |

### 6.2 Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Agent Logic                          │
├─────────────────────────────────────────────────────────────┤
│  1. Monitor Loans                                          │
│     - Fetch loan accounts from program                     │
│     - Check maturity time vs current time                 │
│     - Calculate remaining grace period                      │
├─────────────────────────────────────────────────────────────┤
│  2. Price Monitoring                                       │
│     - Fetch collateral prices from Pyth                    │
│     - Calculate health factor                              │
│     - Detect liquidation opportunities                    │
├─────────────────────────────────────────────────────────────┤
│  3. Decision Engine                                        │
│     - If in grace period: Alert borrower                  │
│     - If health factor < 100%: Suggest repayment          │
│     - If grace period expired: Execute liquidation        │
├─────────────────────────────────────────────────────────────┤
│  4. Transaction Execution                                  │
│     - Build transaction with appropriate instruction        │
│     - Sign with agent's keypair                           │
│     - Send to Solana network                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Grace Period Detection Flow

```python
def check_liquidation_eligibility(loan, current_time):
    # Step 1: Check if loan is matured
    if not loan.is_matured(current_time):
        return {"eligible": False, "reason": "loan_not_matured"}
    
    # Step 2: Check if in grace period
    if loan.is_in_grace_period(current_time):
        remaining = loan.get_remaining_grace_period(current_time)
        
        # Can still liquidate if health factor is critical
        health_factor = calculate_health_factor(loan)
        if health_factor < 10000:  # 100% in basis points
            return {
                "eligible": True, 
                "reason": "critical_health_factor",
                "grace_period_remaining": remaining
            }
        else:
            return {
                "eligible": False, 
                "reason": "in_grace_period",
                "grace_period_remaining": remaining
            }
    
    # Step 3: Grace period expired - full liquidation allowed
    return {"eligible": True, "reason": "grace_period_expired"}
```

### 6.4 Revenue Model

AI Agents earn revenue from:

| Source | Distribution |
|--------|--------------|
| Protection Services | 45% to AI Agent |
| Liquidation Bonus | 35% to AI Agent |
| Protocol Revenue | 20% to protocol |

---

## 7. Code Examples

### 7.1 TypeScript - Building a Transaction

```typescript
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Program ID
const GINVA_PROGRAM_ID = new PublicKey('BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH');

// Instruction enum
const INSTRUCTION = {
  DEPOSIT: 3,
  BORROW: 4,
  REPAY: 5,
  LIQUIDATE: 6,
};

// Build Deposit Instruction
function buildDepositInstruction(
  user: PublicKey,
  amount: number,
  systemConfig: PublicKey,
  reserveWallet: PublicKey,
  collateralMint: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(8);
  data.writeBigUInt64LE(BigInt(amount), 0);
  
  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: user, isSigner: false, isWritable: true }, // token account
      { pubkey: reserveWallet, isSigner: false, isWritable: true },
      { pubkey: systemConfig, isSigner: false, isWritable: false },
      { pubkey: collateralMint, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: GINVA_PROGRAM_ID,
    data: Buffer.concat([Buffer.from([INSTRUCTION.DEPOSIT]), data]),
  });
}

// Build Liquidate Instruction
function buildLiquidateInstruction(
  liquidator: PublicKey,
  loanId: bigint,
  loanAccount: PublicKey,
  assetConfig: PublicKey,
  systemConfig: PublicKey,
  liquidatorCollateral: PublicKey,
  liquidatorRepay: PublicKey,
  reserveWallet: PublicKey
): TransactionInstruction {
  const data = Buffer.alloc(8);
  data.writeBigUInt64LE(loanId, 0);
  
  return new TransactionInstruction({
    keys: [
      { pubkey: liquidator, isSigner: true, isWritable: true },
      { pubkey: loanAccount, isSigner: false, isWritable: true },
      { pubkey: assetConfig, isSigner: false, isWritable: true },
      { pubkey: systemConfig, isSigner: false, isWritable: true },
      { pubkey: liquidatorCollateral, isSigner: false, isWritable: true },
      { pubkey: liquidatorRepay, isSigner: false, isWritable: true },
      { pubkey: reserveWallet, isSigner: false, isWritable: true },
    ],
    programId: GINVA_PROGRAM_ID,
    data: Buffer.concat([Buffer.from([INSTRUCTION.LIQUIDATE]), data]),
  });
}
```

### 7.2 Python - Fetching Loan Data

```python
from solana.rpc.api import Client
from solders.pubkey import Pubkey
import struct

GINVA_PROGRAM_ID = Pubkey.from_string("BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH")
LOAN_DISCRIMINATOR = b"loanac01"
GRACE_PERIOD_SECONDS = 72 * 60 * 60  # 72 hours

def parse_loan_account(data: bytes) -> dict:
    """Parse loan account data from on-chain"""
    if len(data) < 32:
        return None
    
    # Check discriminator
    if data[:8] != LOAN_DISCRIMINATOR:
        return None
    
    return {
        "loan_id": struct.unpack("<Q", data[8:16])[0],
        "borrower": data[16:48].hex(),
        "status": data[48],
        "collateral_amount": struct.unpack("<Q", data[49:57])[0],
        "loan_amount": struct.unpack("<Q", data[57:65])[0],
        "loan_maturity_time": struct.unpack("<Q", data[89:97])[0],
        "is_liquidated": data[97],
        "is_initialized": data[112],
    }

def check_grace_period(loan_maturity_time: int, current_time: int) -> dict:
    """Check if loan is in grace period"""
    if current_time < loan_maturity_time:
        return {
            "in_grace_period": False,
            "matured": False,
            "remaining_seconds": GRACE_PERIOD_SECONDS
        }
    
    time_since_maturity = current_time - loan_maturity_time
    
    if time_since_maturity < GRACE_PERIOD_SECONDS:
        return {
            "in_grace_period": True,
            "matured": True,
            "remaining_seconds": GRACE_PERIOD_SECONDS - time_since_maturity
        }
    
    return {
        "in_grace_period": False,
        "matured": True,
        "remaining_seconds": 0,
        "can_liquidate": True
    }

# Example usage
client = Client("https://api.devnet.solana.com")

# Fetch loans (you would need to iterate through program accounts)
# response = client.get_program_accounts(GINVA_PROGRAM_ID)
```

### 7.3 Rust - Agent Heartbeat

```rust
use pinocchio::pubkey::Pubkey;
use pinocchio::account_info::AccountInfo;

pub fn process_keeper_heartbeat(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _data: &[u8],
) -> ProgramResult {
    // Expected accounts:
    // 0: [signer] keeper/agent
    // 1: [readonly] system_config
    
    if accounts.len() < 2 {
        return Err(GinvaError::InvalidInput.into());
    }
    
    let keeper = &accounts[0];
    let system_config = &accounts[1];
    
    // Validate signer
    if !keeper.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }
    
    // Verify system is active
    let config = load_system_config(system_config, program_id)?;
    if !config.is_active() {
        return Err(GinvaError::AssetNotActive.into());
    }
    
    // Update keeper last heartbeat timestamp
    // (Implementation depends on keeper account structure)
    
    Ok(())
}
```

---

## Appendix: Constants

```rust
// Protocol Parameters
pub const APR: u64 = 800;              // 8% APR
pub const LTV_SAFE: u8 = 20;            // 20% Safe LTV
pub const LTV_STANDARD: u8 = 40;         // 40% Standard LTV
pub const LTV_MAX: u8 = 60;             // 60% Max LTV

// Grace Period (72 hours)
pub const GRACE_PERIOD_SECONDS: i64 = 72 * 60 * 60;  // 259200 seconds
pub const GRACE_PERIOD_BLOCKS: u64 = 72 * 60 * 60 / 400;  // ~4320 blocks

// Security
pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500;  // 5%
pub const REENTRANCY_GUARD_ACTIVE: u8 = 1;

// Agent Revenue Share (basis points)
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;  // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;    // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%

// Pyth Oracle
pub const SOL_USD_FEED_ID: &str = 
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 15;
```

---

*Document Version: 1.0*  
*For GINVA QIE Hackathon*  
*AI Agent Keeper SDK*