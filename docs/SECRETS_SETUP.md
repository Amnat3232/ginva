# GitHub Secrets Setup for AI Keeper

## Secrets Setup Steps

### 1. Go to GitHub Repository Settings

```
https://github.com/Dr-SoloDev/ginva/settings/secrets/actions
```

### 2. Add Each Secret

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `GROQ_API_KEY` | `gsk_xxxx...` | Get from https://console.groq.com |
| `RPC_URL` | `https://api.devnet.solana.com` | Or other RPC of your choice |
| `KEEPER_WALLET_PRIVATE_KEY` | Base58 private key | ⚠️ Must be a wallet with SOL on devnet |

### 3. Verify Workflow Runs

Go to: `https://github.com/Dr-SoloDev/ginva/actions/workflows/ai-keeper.yml`

---

## Security Warnings

### For KEEPER_WALLET_PRIVATE_KEY:

1. **Create a new wallet** for keeper (don't use main wallet)
2. **Fund only on devnet** (not mainnet)
3. **Limit the amount of SOL** in the wallet - don't put too much

```bash
# Create new keeper wallet (run locally)
solana-keygen new --no-passphrase --outfile keeper-wallet.json
```

### Finding Private Key (Base58):

```bash
# Convert JSON to Base58
solana-keygen pubkey keeper-wallet.json
# For Base58, read from file and convert
```

---

## After Setup Complete

1. Workflow will run every 5 minutes
2. Check in Actions tab
3. View logs in each run

---

## Testing the Workflow

```bash
# Manual trigger (via GitHub UI)
# Go to Actions > AI Keeper > Run workflow
```

---

**Note:** If you don't want to put private key in GitHub, you can use other methods:
- Use GitHub Apps instead
- Deploy on Vercel with more secure environment variables