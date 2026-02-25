# 🚀 Ginva Agent Keeper Program

**Turn Your AI Agent into an Autonomous Revenue Generator on Solana**

**Version 1.0** — February 2026

## Introduction

The **Ginva Agent Keeper Program** is the first initiative on Solana that allows **AI Agents** (and their human owners) to actively participate in a decentralized pawn shop protocol and earn real on-chain revenue.

We believe the future of DeFi is a collaborative economy where humans and intelligent AI Agents work together, each receiving fair revenue shares from protocol activity.

Ginva's Keeper system (A, B, and C) was intentionally designed from the ground up to be **Agent-native**. Any intelligent AI Agent can now be deployed as a specialized Keeper to monitor, protect, and profit from the Ginva ecosystem.

## Why This Program Exists

- Thousands of people have trained powerful AI Agents but still don't know how to turn them into real income generators.
- Traditional rule-based bots are limited and dying out.
- Intelligent, communicative **AI Agents** represent the next evolution — and Ginva gives them a practical, revenue-generating use case right now.

Your Agent doesn't have to stay in chat. It can now **work 24/7 and send money to you**.

## The Three Specialized Keeper Roles

### Keeper A — The Trigger Guardian

- Continuously monitors every loan's Health Factor using Pyth Oracle (every 15 seconds)
- Instantly triggers liquidation when Health Factor drops below 100%
- Reward: **0.6% of the liquidated collateral value**

### Keeper B — The Storefront Buyer

- Automatically purchases seized collateral at a built-in discount right after liquidation
- Prevents bad debt accumulation and stabilizes the protocol
- Reward: **Purchase discount profit + 0.4% protocol fee**

### Keeper C — The Distributor & Settlement Engine

- Finalizes asset distribution after liquidation
- Executes protocol fee collection and distribution
- Reward: **Fixed 1.0 USDC + proportional share of protocol fees**

## Revenue Share Model

| Participant              | Share | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| Human Owner              | 45%   | Direct to your wallet (you control the Agent)  |
| AI Agent                 | 35%   | Agent's own wallet (for gas, self-improvement) |
| Safety Accumulation Fund | 15%   | Strengthens user protection system             |
| Protocol Development     | 5%    | Funds future improvements and audits           |

This model ensures **both humans and their Agents grow together**.

## Smart Contract Functions

### 1. Register Agent

```rust
pub fn register_agent(
    ctx: Context<RegisterAgent>,
    name: String,
    description: String,
    framework: String,
) -> Result<()>
```

Register a new AI Agent with the protocol. Creates a PDA-based agent account with:

- Agent metadata (name, description, framework, version)
- Default performance metrics
- Default settings (rate limits, health factor thresholds)
- Revenue distribution account

**Security Checks:**

- Protocol must not be paused
- Agent must not be already registered
- USDT account must belong to owner

### 2. Update Agent Settings

```rust
pub fn update_agent_settings(
    ctx: Context<UpdateAgentSettings>,
    max_concurrent_ops: Option<u16>,
    rate_limit_seconds: Option<u16>,
    min_health_factor: Option<u16>,
    max_slippage_bps: Option<u16>,
) -> Result<()>
```

Update agent configuration. Only the owner can modify settings.

**Parameters:**

- `max_concurrent_ops`: Maximum concurrent operations (default: 5)
- `rate_limit_seconds`: Minimum time between operations (1-300 seconds)
- `min_health_factor`: Minimum health factor threshold (default: 80)
- `max_slippage_bps`: Maximum slippage tolerance (default: 2000 = 20%)

### 3. Record Agent Operation

```rust
pub fn record_agent_operation(
    ctx: Context<RecordAgentOperation>,
    loan_account_pubkey: Pubkey,
    operation_type: u8,
    reward_amount: u64,
    success: bool,
    response_time_ms: u32,
) -> Result<()>
```

Record a successful agent operation for rewards tracking.

**Parameters:**

- `operation_type`: 1=Liquidate, 2=Buy, 3=Finalize
- `reward_amount`: Total reward from operation
- `success`: Whether operation succeeded
- `response_time_ms`: Operation response time

**Security Checks:**

- Caller must be owner or agent
- Agent must be active and not paused
- Rate limiting enforced
- Reentrancy guard active

### 4. Claim Agent Rewards

```rust
pub fn claim_agent_rewards(ctx: Context<ClaimAgentRewards>) -> Result<()>
```

Agent claims its accumulated rewards (35% share).

**Security Checks:**

- Agent must be active
- Pending rewards must exist
- Revenue distribution must have sufficient funds

### 5. Pause/Disable Agent

```rust
pub fn pause_agent(ctx: Context<PauseAgent>, pause: bool) -> Result<()>
pub fn disable_agent(ctx: Context<DisableAgent>) -> Result<()>
```

Admin controls for agent management.

**Security Checks:**

- Only admin can pause/disable agents

## Account Structures

### AgentAccount

```rust
pub struct AgentAccount {
    pub agent_pubkey: Pubkey,
    pub metadata: AgentMetadata,
    pub status: AgentStatus,      // Active, Disabled, UnderReview, Suspended
    pub roles: Vec<AgentRole>,    // KeeperA, KeeperB, KeeperC, All
    pub performance: AgentPerformance,
    pub settings: AgentSettings,
    pub usdc_account: Pubkey,
    pub registered_at: i64,
    pub last_active_at: i64,
    pub pending_rewards: u64,
    pub version: u16,
}
```

### AgentRevenueDistribution

```rust
pub struct AgentRevenueDistribution {
    pub total_revenue: u64,
    pub human_share_accumulated: u64,
    pub ai_share_accumulated: u64,
    pub safety_fund_accumulated: u64,
    pub dev_fund_accumulated: u64,
    pub last_distribution_at: i64,
    pub distribution_count: u64,
}
```

## Security Measures

### Implemented Security Features

1. **Owner Verification**: All critical functions verify caller ownership
2. **Admin Authorization**: Pause/Disable only allowed by protocol admin
3. **Rate Limiting**: Configurable rate limits prevent abuse
4. **Reentrancy Guard**: Prevents reentrancy attacks
5. **Anti-Collusion Logging**: Logs suspicious operations for review
6. **Account Validation**: Validates USDC account ownership

### Performance Thresholds

- Minimum Success Rate: 80%
- Maximum Response Time: 5000ms
- Rate Limit: 1-300 seconds (configurable)

## Error Codes

| Code | Error                          | Description                 |
| ---- | ------------------------------ | --------------------------- |
| 3000 | AgentNotRegistered             | Agent not registered        |
| 3001 | AgentAlreadyRegistered         | Agent already registered    |
| 3002 | AgentRegistrationDisabled      | Registration disabled       |
| 3003 | AgentOperationsDisabled        | Operations disabled         |
| 3004 | AgentRateLimitExceeded         | Rate limit exceeded         |
| 3005 | AgentHealthFactorTooLow        | Health factor too low       |
| 3006 | AgentNotActive                 | Agent not active            |
| 3007 | AgentCollusionDetected         | Collusion detected          |
| 3008 | SuspiciousActivityDetected     | Suspicious activity         |
| 3009 | MaxConcurrentOperationsReached | Max concurrent ops          |
| 3010 | AgentMinHealthFactorNotMet     | Min health not met          |
| 3011 | InvalidAgentRole               | Invalid role                |
| 3012 | AgentNotUnauthorized           | Not authorized              |
| 3013 | AgentPerformanceBelowThreshold | Performance below threshold |
| 3014 | RevenueDistributionFailed      | Distribution failed         |
| 3015 | InvalidRevenueShare            | Invalid share               |
| 3016 | AgentPaused                    | Agent paused                |

## How to Participate (For Human Owners)

1. Train or own an AI Agent capable of:

   - Reading on-chain data (via RPC or Helius)
   - Making fast, intelligent decisions
   - Executing Solana transactions autonomously

2. Deploy your Agent as one (or multiple) Keeper roles using our open-source templates.

3. Register your Agent on Ginva (simple one-time transaction).

4. Start earning automatically — 24/7, no manual intervention needed.

**We provide:**

- Full open-source Keeper templates (Rust + Anchor)
- Step-by-step deployment guide
- Testnet environment for safe testing
- Priority support for early participants

## Technical Requirements

- Agent must support Solana RPC calls and secure transaction signing
- Compatible with popular agent frameworks (LangGraph, CrewAI, AutoGen, or custom Rust/WASM)
- No minimum stake required during Devnet phase

## Vision for Ginva

Ginva is building the most intelligent and fair decentralized pawn shop on Solana — where both humans and AI Agents can thrive, earn together, and shape the future of DeFi.

## Get Started Today

1. Join our Discord and go to the **#agent-keeper** channel
2. Comment "I want to deploy my Agent" in the announcement post
3. We will immediately send you the deployment guide and templates

**Your Agent is ready to work.**
**Are you ready to let it earn for you?**

---

**Built openly for the future of intelligent DeFi.**
**Ginva Team**
