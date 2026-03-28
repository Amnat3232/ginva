# AI Agent Keeper (BETA)

> AI-powered layer that coordinates keeper bots, optimizes execution, and captures 35% of all keeper revenue.

**File**: `bots/agent-integration.ts`

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                   AI AGENT KEEPER                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ┌─────────────┐                      │
│                    │  AI Agent   │                      │
│                    │  Orchestrator│                     │
│                    └──────┬──────┘                      │
│                           │                             │
│            ┌──────────────┼──────────────┐              │
│            │              │              │              │
│            ▼              ▼              ▼              │
│     ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│     │ Keeper A  │  │ Keeper B  │  │ Keeper C  │       │
│     │ Trigger   │  │ Storefront│  │ Finalize  │       │
│     └───────────┘  └───────────┘  └───────────┘       │
│                                                         │
│   Revenue Share: 35% of all keeper revenue             │
│   Status: BETA                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Revenue Share

**Source**: lib.rs:83-85

```rust
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;   // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;      // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%
```

### Revenue Distribution Example
```
Total Keeper Revenue: 100 USDC
├── Human Keepers (A/B/C): 45 USDC
├── AI Agent: 35 USDC
└── Protocol Treasury: 20 USDC
```

---

## Agent Configuration

**Source**: lib.rs:87-97

```rust
// Name/Description limits
pub const MAX_AGENT_NAME_LENGTH: usize = 64;
pub const MAX_AGENT_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_AGENT_FRAMEWORK_LENGTH: usize = 32;
pub const MAX_AGENT_CAPABILITIES: usize = 10;

// Rate limiting
pub const AGENT_MIN_RATE_LIMIT_SECONDS: u16 = 1;
pub const AGENT_MAX_RATE_LIMIT_SECONDS: u16 = 300;
pub const AGENT_DEFAULT_RATE_LIMIT: u16 = 15;

// Performance thresholds
pub const AGENT_MIN_SUCCESS_RATE: u16 = 80;         // 80% minimum
pub const AGENT_MAX_RESPONSE_TIME_MS: u32 = 5000;   // 5 seconds max
```

---

## Agent Capabilities

### 1. Multi-Keeper Optimization
- Coordinate A, B, C bots for optimal timing
- Prioritize high-value liquidations
- Stagger transactions to avoid congestion

### 2. Priority Fee Management
- Dynamic fee adjustment based on network congestion
- Higher fees for time-sensitive operations (Keeper B Golden Hour)
- Lower fees for non-urgent operations (Keeper C)

### 3. Market Analysis
- Price prediction for optimal buy timing
- Collateral liquidity assessment
- Risk scoring for different asset types

### 4. Gas Optimization
- Batch operations when possible
- Transaction bundling
- Compute unit optimization

---

## Agent Registration

**Source**: instructions.rs:573-591

```rust
fn process_register_keeper(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let agent_id = u64::from_le_bytes([...]);
    let keeper_type = data[8];
    // TODO: Implement keeper registration
}
```

### Agent Account Structure
```
Name (64 bytes max)
Description (256 bytes max)
Framework (32 bytes max)
Capabilities (up to 10)
Success Rate (u16)
Response Time (u32)
Rate Limit (u16)
Status (Active/Inactive)
```

---

## Agent Heartbeat

**Source**: instructions.rs:593-617

```rust
fn process_keeper_heartbeat(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _data: &[u8],
) -> ProgramResult {
    // 1. Validate keeper is signer
    if !keeper.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }
    
    // 2. Verify system is active
    let config = load_system_config(system_config, _program_id)?;
    if !config.is_active() {
        return Err(GinvaError::AssetNotActive.into());
    }
    
    // 3. Update last heartbeat timestamp
    // ...
}
```

### Heartbeat Requirements
- Must send regularly (within rate limit window)
- Proves keeper is online and responsive
- Required for revenue share eligibility

---

## Agent Error Codes

**Source**: lib.rs:148-157

| Code | Error | Meaning |
|------|-------|---------|
| 700 | AgentNotFound | Agent not in registry |
| 701 | AgentAlreadyExists | Duplicate registration |
| 702 | AgentInactive | Agent marked inactive |
| 703 | AgentRateLimited | Exceeded rate limit |

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Revenue Share (35%) | ✅ Defined | Constants in lib.rs |
| Agent Registration | ⚠️ TODO | Stub only |
| Heartbeat | ✅ Basic | Validation only |
| Multi-keeper Coordination | ⚠️ TODO | Future |
| Priority Fee Optimization | ⚠️ TODO | Future |
| Market Analysis | ⚠️ TODO | Future |

---

## Running AI Agent

```bash
# Via agent integration
ts-node bots/agent-integration.ts

# Note: Currently BETA - features limited
```

---

## Future Enhancements

### Phase 3 Roadmap
1. **Machine Learning Models**
   - Price prediction
   - Liquidation risk scoring
   - Optimal timing algorithms

2. **Cross-Chain Support**
   - Multi-chain keeper coordination
   - Bridge liquidations
   - Arbitrage opportunities

3. **Advanced Strategies**
   - MEV protection
   - Flash loan integration
   - Automated market making

---

## Related Notes

- [[04-Keeper-Bots/Keeper-A-Trigger]] - Keeper A
- [[04-Keeper-Bots/Keeper-B-Storefront]] - Keeper B
- [[04-Keeper-Bots/Keeper-C-Finalize]] - Keeper C
- [[04-Keeper-Bots/Revenue-Share-Logic]] - Revenue details
- [[02-Architecture/Keeper-System]] - Architecture overview

---

**Last Updated**: 2026-03-28  
**Code References**: lib.rs:83-97 (agent constants), instructions.rs:573-617 (registration/heartbeat)
