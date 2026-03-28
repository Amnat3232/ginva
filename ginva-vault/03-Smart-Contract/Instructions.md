# Smart Contract Instructions

> All 12 instruction handlers for the GINVA Pinocchio program. Each instruction is dispatched from `process_instruction` based on the first byte of instruction data.

## Instruction Enum (instructions.rs:22-35)

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

---

## Instruction Dispatcher (instructions.rs:61-97)

```rust
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.is_empty() {
        return Err(GinvaError::InvalidInstruction.into());
    }

    let instruction = GinvaInstruction::try_from(data[0])
        .map_err(|_| GinvaError::InvalidInstruction)?;

    match instruction {
        GinvaInstruction::InitializeSystem => { ... }
        GinvaInstruction::InitializeProtocolConfig => { ... }
        // ... etc
    }
}
```

---

## Instruction Details

### 0. InitializeSystem

**Function**: `process_initialize_system` (instructions.rs:136-207)  
**Purpose**: Initialize the protocol configuration accounts

**Data Format**: `deposit_fee_bps: u16`

**Accounts Required** (7 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | admin | signer | Protocol admin |
| 1 | system_config | writable | System config account |
| 2 | protocol_config | writable | Protocol config account |
| 3 | ops_wallet | writable | Operations wallet (token account) |
| 4 | reserve_wallet | writable | Reserve wallet (token account) |
| 5 | collateral_mint | readonly | Collateral mint pubkey |
| 6 | loan_mint | readonly | Loan mint pubkey |

**Account Layout Written** (lib.rs:179-204):
- Discriminator: `b"config__"` (8 bytes)
- Admin pubkey (32 bytes)
- Authority pubkeys (4 × 32 bytes)
- Mint pubkeys (2 × 32 bytes)
- deposit_fee_bps (2 bytes at offset 282)
- is_active flag (1 byte at offset 284)

---

### 1. InitializeProtocolConfig

**Function**: `process_initialize_protocol_config` (instructions.rs:619-659)  
**Purpose**: Initialize protocol-specific configuration

**Data Format**: `liquidation_timeout: i64, auto_swap_reward_bps: u16, distribute_reward_bps: u16`

**Accounts Required** (2 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | admin | signer | Protocol admin |
| 1 | protocol_config | writable | Protocol config account |

**Default Values Written**:
- liquidation_timeout: 86400 (24 hours)
- auto_swap_reward_bps: 1000 (10%)
- distribute_reward_bps: 2000 (20%)

---

### 2. InitializeAsset

**Function**: `process_initialize_asset` (instructions.rs:209-278)  
**Purpose**: Add a new asset to the protocol

**Data Format**: 
```
asset_id: u64, utilization_ratio_bps: u16, interest_rate_bps: u16,
liquidation_bonus_bps: u16, max_ltv_bps: u16, liquidation_threshold_bps: u16,
debt_weight_bps: u64
```

**Accounts Required** (6 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | admin | signer | Protocol admin |
| 1 | asset_config | writable | Asset config account |
| 2 | system_config | writable | System config account |
| 3 | mint | readonly | Asset mint pubkey |
| 4 | reserve_wallet | writable | Reserve wallet for this asset |
| 5 | debt_share_mint | writable | Debt share mint for this asset |

---

### 3. Deposit

**Function**: `process_deposit` (instructions.rs:280-359)  
**Purpose**: User deposits collateral into the protocol

**Data Format**: `amount: u64`

**Accounts Required** (6 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | user | signer | Depositing user |
| 1 | user_token_account | writable | User's token account |
| 2 | reserve_wallet | writable | Protocol reserve wallet |
| 3 | system_config | readonly | System config account |
| 4 | collateral_mint | readonly | Collateral mint pubkey |
| 5 | token_program | readonly | Token program (SPL or Token-2022) |

**Key Logic**:
1. Validates signer (instructions.rs:313-315)
2. Validates token program ID (instructions.rs:318-320)
3. Checks protocol is active (instructions.rs:326-328)
4. Calculates fee: `fee = amount × deposit_fee_bps / 10000`
5. Calculates net amount: `net = amount - fee`
6. Updates `total_collateral` in system_config (instructions.rs:339-356)

---

### 4. Borrow

**Function**: `process_borrow` (instructions.rs:361-425)  
**Purpose**: User borrows USDC against deposited collateral

**Data Format**: `amount: u64, asset_id: u64`

**Accounts Required** (6 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | borrower | signer | Borrowing user |
| 1 | loan_account | writable | Loan account (PDA) |
| 2 | asset_config | writable | Asset config account |
| 3 | system_config | writable | System config account |
| 4 | borrower_token_account | writable | Borrower's USDC account |
| 5 | collateral_mint | readonly | Collateral mint pubkey |

**Key Validations** (instructions.rs:400-420):
1. Protocol not paused
2. Asset is active
3. Circuit breaker not triggered
4. Supply cap not exceeded

---

### 5. Repay

**Function**: `process_repay` (instructions.rs:427-469)  
**Purpose**: User repays a loan (partially or fully)

**Data Format**: `loan_id: u64, amount: u64`

**Accounts Required** (5 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | payer | signer | Repaying user |
| 1 | loan_account | writable | Loan account |
| 2 | system_config | readonly | System config account |
| 3 | payer_token_account | writable | Payer's USDC account |
| 4 | reserve_wallet | writable | Protocol reserve wallet |

**Key Logic**:
- Validates payer is loan borrower (instructions.rs:462-464)
- TODO: Interest calculation and repayment processing

---

### 6. Liquidate

**Function**: `process_liquidate` (instructions.rs:471-511)  
**Purpose**: Liquidate an undercollateralized loan (Keeper A triggers)

**Data Format**: `loan_id: u64`

**Accounts Required** (8 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | liquidator | signer | Keeper/liquidator |
| 1 | loan_account | writable | Loan account |
| 2 | asset_config | writable | Asset config |
| 3 | system_config | writable | System config |
| 4 | liquidator_collateral_account | writable | Liquidator's collateral account |
| 5 | liquidator_repay_account | writable | Liquidator's USDC account |
| 6 | reserve_wallet | writable | Protocol reserve |
| 7 | token_program | readonly | Token program |

**Validations**:
- Loan is initialized (instructions.rs:500-502)
- Loan not already liquidated (instructions.rs:504-506)

---

### 7. Withdraw

**Function**: `process_withdraw` (instructions.rs:513-530)  
**Purpose**: User withdraws collateral (no outstanding loans)

**Data Format**: `amount: u64`

**Status**: ⚠️ **TODO** - Not fully implemented (instructions.rs:527)

---

### 8. StakeAgent

**Function**: `process_stake_agent` (instructions.rs:532-556)  
**Purpose**: Stake tokens to an AI agent

**Data Format**: `agent_id: u64, amount: u64`

**Status**: ⚠️ **TODO** - Not fully implemented (instructions.rs:553)

---

### 9. UnstakeAgent

**Function**: `process_unstake_agent` (instructions.rs:558-571)  
**Purpose**: Unstake tokens from an AI agent

**Data Format**: `agent_id: u64, amount: u64` (implied)

**Status**: ⚠️ **TODO** - Not fully implemented (instructions.rs:568)

---

### 10. RegisterKeeper

**Function**: `process_register_keeper` (instructions.rs:573-591)  
**Purpose**: Register a keeper bot in the protocol

**Data Format**: `agent_id: u64, keeper_type: u8`

**Status**: ⚠️ **TODO** - Not fully implemented (instructions.rs:588)

---

### 11. KeeperHeartbeat

**Function**: `process_keeper_heartbeat` (instructions.rs:593-617)  
**Purpose**: Keeper sends heartbeat to stay active

**Data Format**: Empty (no data required)

**Accounts Required** (2 total):

| Index | Name | Mutability | Description |
|-------|------|------------|-------------|
| 0 | keeper | signer | Keeper wallet |
| 1 | system_config | readonly | System config |

**Validations**:
- Keeper is signer (instructions.rs:606-608)
- System is active (instructions.rs:611-613)

---

## Instruction Implementation Status

| # | Instruction | Status | Notes |
|---|-------------|--------|-------|
| 0 | InitializeSystem | ✅ Complete | Full implementation |
| 1 | InitializeProtocolConfig | ✅ Complete | Writes defaults |
| 2 | InitializeAsset | ✅ Complete | Basic init |
| 3 | Deposit | 🟡 Partial | CPI TODO |
| 4 | Borrow | 🟡 Partial | LTV checks TODO |
| 5 | Repay | 🟡 Partial | Interest calc TODO |
| 6 | Liquidate | 🟡 Partial | Full flow TODO |
| 7 | Withdraw | ⚠️ TODO | Stub only |
| 8 | StakeAgent | ⚠️ TODO | Stub only |
| 9 | UnstakeAgent | ⚠️ TODO | Stub only |
| 10 | RegisterKeeper | ⚠️ TODO | Stub only |
| 11 | KeeperHeartbeat | ✅ Complete | Validation only |

---

## Related Notes

- [[Processor-Overview]] - Instruction processing flow
- [[Account-Validation-Rules]] - Account validation patterns
- [[Common-Pitfalls]] - Pinocchio-specific gotchas
- [[MOC-Smart-Contract]] - Smart contract map of content

---

**Last Updated**: 2026-03-28  
**Code References**: instructions.rs:22-35 (enum), instructions.rs:61-97 (dispatcher), instructions.rs:136-659 (implementations)
