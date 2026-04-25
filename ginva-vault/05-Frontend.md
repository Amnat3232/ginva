# Frontend

> GINVA frontend application - React + TypeScript + Vite 8

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite 8 (Rolldown) |
| Styling | CSS + Bootstrap |
| Wallet | @solana/wallet-adapter |
| Routing | react-router-dom |

## Architecture

```
app/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route pages
│   ├── lib/           # Utilities, program client
│   ├── data/          # Mock data, constants
│   └── types/         # TypeScript types
├── public/            # Static assets
└── dist/              # Build output
```

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Homepage |
| Borrow | `/borrow` | Borrower dashboard |
| Earn | `/earn` | Lending/staking |
| Keeper | `/keeper` | Keeper dashboard |
| Admin | `/admin` | Admin panel |

## Program Integration

```typescript
// app/src/lib/ginvaProgram.ts
export const GINVA_PROGRAM_ID = new PublicKey(
    'HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj'
);
```

## Build Commands

```bash
cd app
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

## Deployment
- **Platform**: Vercel
- **URL**: https://ginva.pages.dev
- **Auto-deploy**: On push to main

## Related
- [[01-Project-Overview]]
- [[06-CI-CD]]

---
**Last Updated**: 2026-03-28
