# Keeper System

> The GINVA Keeper System consists of three specialized bots (A, B, C) plus an AI Agent for autonomous protocol maintenance.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GINVA Protocol                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│   │ Keeper A│    │ Keeper B│    │ Keeper C│           │
│   │ Trigger │    │Storefront│   │Finalize │           │
│   │ Liquid. │    │  Buy    │    │ Distro  │           │
│   └────┬────┘    └────┬────┘    └────┬────┘           │
│        │              │              │                 │
│        └──────────────┼──────────────┘                 │
│                       │                                │
│               ┌───────┴───────┐                       │
│               │   AI Agent    │                       │
│               │ (35% Revenue) │                       │
│               └───────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Keeper A - Trigger Liquidation
- **Purpose**: Monitor Health Factor and trigger liquidation
- **Trigger**: When HF < 100%
- **Reward**: % of liquidation penalty

## Keeper B - Storefront Buyer
- **Purpose**: Buy defaulted collateral from Storefront
- **Action**: Purchase NFT ticket representing collateral
- **Reward**: Spread between purchase price and market value

## Keeper C - Finalize Distribution
- **Purpose**: Finalize auction distribution after grace period
- **Trigger**: After 72h grace period expires
- **Reward**: Fixed fee per finalization

## AI Agent Keeper (BETA)
- **Revenue Share**: 35% of all keeper revenue
- **Capabilities**: Multi-keeper optimization, priority fee management

## Related
- [[04-Keeper-Bots/Keeper-A-Trigger]]
- [[04-Keeper-Bots/Keeper-B-Storefront]]
- [[04-Keeper-Bots/Keeper-C-Finalize]]
- [[04-Keeper-Bots/AI-Agent-Keeper]]

---
**Last Updated**: 2026-03-28
