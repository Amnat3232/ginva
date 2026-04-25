# Deployment & Links

**Last Updated:** 2026-03-28

## Production (Live)

- **Frontend URL**: [https://ginva.pages.dev](https://ginva.pages.dev)
- **Vercel Dashboard**: [https://vercel.com/dr-solodevs-projects/app](https://vercel.com/dr-solodevs-projects/app)

## Devnet

- **Program ID**: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`
- **Solana Explorer**: [https://explorer.solana.com/address/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet](https://explorer.solana.com/address/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet)
- **Program Explorer (Alternative)**: [https://solscan.io/account/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet](https://solscan.io/account/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet)

## Important Information

### Frontend
- Framework: React + TypeScript
- Build Tool: Vite 8 (Rolldown)
- Hosting: Vercel
- Current Deployment: `theta-gilt-82`
- Environment: Production

### Smart Contract
- Framework: **Pinocchio** (no_std)
- Network: **Devnet**
- Program ID: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`
- Source in lib.rs: `declare_id!("GWcQGdrSiVk8p58bYSmw8FTceR9dcHAKQzw7yEyjLTsy")` (`programs/ginva-pinocchio/src/lib.rs:22`)
- Last Deployed: March 2026

### Related Environment Variables
- `NEXT_PUBLIC_PROGRAM_ID` → Must match Program ID above
- `VITE_PROGRAM_ID` → In app/src/lib/ginvaProgram.ts:29-31
- `RPC_URL` → Use Helius / QuickNode / Public Devnet

## Quick Actions

- [View Live App](https://ginva.pages.dev)
- [Open Vercel Dashboard](https://vercel.com/dr-solodevs-projects/app)
- [Check Program on Explorer](https://explorer.solana.com/address/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet)

## Instruction List (12 Instructions)

| ID | Instruction | Discriminator | Description |
|----|-------------|---------------|-------------|
| 0 | InitializeSystem | 0x00 | Initialize protocol configuration |
| 1 | InitializeProtocolConfig | 0x01 | Set liquidation timeout, rewards |
| 2 | InitializeAsset | 0x02 | Add new collateral asset |
| 3 | Deposit | 0x03 | Deposit collateral |
| 4 | Borrow | 0x04 | Borrow against collateral |
| 5 | Repay | 0x05 | Repay loan |
| 6 | Liquidate | 0x06 | Liquidate undercollateralized loan |
| 7 | Withdraw | 0x07 | Withdraw collateral |
| 8 | StakeAgent | 0x08 | Stake to agent |
| 9 | UnstakeAgent | 0x09 | Unstake from agent |
| 10 | RegisterKeeper | 0x0A | Register keeper agent |
| 11 | KeeperHeartbeat | 0x0B | Keeper heartbeat |

Source: `programs/ginva-pinocchio/src/instructions.rs:22-35`

## Protocol Parameters (Hardcoded)

| Parameter | Value | Source |
|-----------|-------|--------|
| APR | 8% (800 bps) | `lib.rs:51` |
| LTV Safe | 20% | `lib.rs:52` |
| LTV Standard | 40% | `lib.rs:53` |
| LTV Max | 60% | `lib.rs:54` |
| Interest Precision | 1,000,000 | `lib.rs:37` |
| AI Agent Revenue Share | 35% | `lib.rs:84` |
| Human Keeper Share | 45% | `lib.rs:83` |
| Protocol Share | 20% | `lib.rs:85` |

## History of Deployments

| Date | Event | Program ID | Notes |
|------|-------|------------|-------|
| 2026-03-28 | First Devnet Deploy | `HQd5KL...hBj` | Pinocchio + Vite 8 |
| | | | |

---

## Related Notes
- [[00-Home]]
- [[01-Project-Overview]]
- [[06-CI-CD]]
- [[08-Next-Steps]]
- [[02-Architecture/Security-Model]]

---
**Last Updated**: 2026-03-28
