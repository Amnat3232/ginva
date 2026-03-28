# GINVA Project Overview

## Core Concept
GINVA เป็นแพลตฟอร์ม **Decentralized Pawn Shop** บน Solana  
ผู้ใช้ฝาก collateral (SOL, BTC, ETH wrapped) เพื่อยืม USDC อัตราดอกเบี้ยคงที่ **8% APR**  
เน้นความปลอดภัยสูง + Immutable parameters + AI Agent Keeper

## Key Features
- **Interest Rate**: 8% fixed APR (hardcoded)
- **LTV Ratios**: Safe 20% | Standard 40% | Max 60% (hardcoded)
- **Liquidation**: Immediate เมื่อ Health Factor < 100% + 72h Grace Period
- **Keeper System**: 3 Keepers (A: Trigger, B: Storefront, C: Finalize) + AI Agent (35% revenue share)
- **Security**: Hardcoded params, Pyth Oracle, Supply Cap, Circuit Breaker, Anti Venus-style attack

## Tech Stack
- Smart Contract: **Rust + Pinocchio** (no_std) → `programs/ginva-pinocchio/`
- Keeper Bots: TypeScript → `bots/`
- Frontend: React + TypeScript + Vite 8 → `app/`
- CI/CD: GitHub Actions (cargo-build-sbf)

## Design Philosophy
- **Immutable First** — ลด attack surface ให้มากที่สุด
- **No Admin Keys** สำหรับ parameter หลัก
- **AI + Human Keeper** ร่วมกัน
- **Protect against low-liquidity token manipulation** (เรียนรู้จาก Venus exploit)

## Deployment Status (Phase 5 ✅)
- **Program ID**: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`
- **Network**: Solana Devnet
- **Frontend**: https://app-theta-gilt-82.vercel.app

## Related Notes
- [[02-Architecture/Pinocchio-Framework]]
- [[02-Architecture/Security-Model]]
- [[02-Architecture/Keeper-System]]
- [[08-Next-Steps]]

**Last Sync**: 2026-03-28
