# 🚀 GINVA Devnet Deployment Guide

## Program Info

- **Program ID:** `Ev9HTrf45JBM5PBvAG9v6AUb5cw4XeGgKXmrk7RtQm3D`
- **Network:** Solana Devnet

---

## Deployment Steps

### 1. Check Environment

```bash
# Check Solana version
solana --version

# Check Anchor version
anchor --version

# Check wallet
solana address
```

### 2. Configure Wallet

```bash
# Set wallet to your own
solana config set --keypair ~/.config/solana/id.json

# Set network to devnet
solana config set --url devnet
```

### 3. Build Program

```bash
anchor build
```

### 4. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 5. Run Setup Script

```bash
ts-node scripts/setup-devnet.ts
```

---

## After Deployment

### Test the System

```bash
# Run all tests
anchor test

# Run specific test
anchor test --skip-deploy tests/integration-devnet.test.ts
```

### Check Program on Explorer

```
https://explorer.solana.com/address/2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou?cluster=devnet
```

---

## Test Cases

| #   | Function                       | Test Method               |
| --- | ------------------------------ | ------------------------- |
| 1   | Deposit Collateral             | Deposit SOL as collateral |
| 2   | Borrow USDC                    | Borrow USDC using SOL     |
| 3   | Extend Loan                    | Extend loan term          |
| 4   | Repay Loan                     | Repay loan                |
| 5   | Stake LP                       | Deposit USDC for interest |
| 6   | Unstake LP                     | Withdraw USDC             |
| 7   | Trigger Liquidation (HF)       | Test HF < 100%            |
| 8   | Trigger Liquidation (Maturity) | Test after 72hr deadline  |

---

## Common Issues

### 1. Low Balance

```bash
# Request airdrop
solana airdrop 2
```

### 2. Program Already Deployed

```bash
# Close old program first
solana program close <PROGRAM_ID> --buffers
```

### 3. Wallet Not Found

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json
```

---

## Contact

If you have issues, check:

- Discord: #dev-support
- GitHub Issues
