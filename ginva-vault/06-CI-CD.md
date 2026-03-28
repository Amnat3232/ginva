# CI/CD

> GINVA continuous integration and deployment pipeline.

## Workflows

### CI Workflow (`ci.yml`)

```yaml
Triggers: push, pull_request to main/develop
Jobs:
  - lint (Rust + TypeScript)
  - build (Pinocchio program)
  - test (unit + integration)
  - frontend-build
```

### Deploy Workflow (`deploy.yml`)

```yaml
Triggers: push to main
Jobs:
  - build Pinocchio program
  - deploy to Devnet
  - deploy frontend to Vercel
```

## Build Process

### Smart Contract
```bash
cd programs/ginva-pinocchio
cargo build --release
cargo-build-sbf  # For deployment
```

### Frontend
```bash
cd app
npm install
npm run build
```

## Environment

| Variable | Devnet | Mainnet |
|----------|--------|---------|
| Program ID | HQd5KL...hBj | TBD |
| RPC | devnet.solana.com | api.mainnet-beta.solana.com |
| USDC Mint | Devnet USDC | EPjFW...nLi (mainnet) |

## Deployment Status
- ✅ Devnet deployed
- ⏳ Mainnet pending audit

## Related
- [[05-Frontend]]
- [[08-Next-Steps]]

---
**Last Updated**: 2026-03-28
