# GINVA Mobile App

React Native mobile app for GINVA - Digital Asset Pawnshop on Solana.

## Features

- **Portfolio Dashboard** - View your assets and balances
- **Borrow USDC** - Use your SOL as collateral
- **Earn Yield** - Stake USDC and earn interest
- **Solana Integration** - Connect with mobile wallets

## Tech Stack

- **Expo SDK 52** - React Native framework
- **Solana Web3.js** - Blockchain interaction
- **React Navigation** - Bottom tab navigation
- **Expo Blur** - Glassmorphism effects

## Design

- Dark theme (#0a0e17 background)
- Green accent (#10b981)
- Glassmorphism cards with blur
- Mobile-first UX

## Getting Started

```bash
cd mobile
npm install
npx expo start
```

## Wallet Connection

The app supports mobile wallet connections via `@solana-mobile/mobile-wallet-adapter-protocol`. For production, integrate with wallets like:

- Solflare Mobile
- Phantom Mobile
- Backpack

## Screens

1. **Portfolio** - Main dashboard with balance, stats, market prices
2. **Borrow** - Create loans with crypto collateral
3. **Earn** - Stake USDC for yield
4. **More** - Tickets, redeem, settings

## Smart Contract

Program ID: `6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU`

Network: Solana Devnet
