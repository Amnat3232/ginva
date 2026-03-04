// pawn-shop-bot.ts
// Free-for-All Model Bot - Anyone can buy with 6% discount
// At minute 5: First to buy wins - no exclusive rights

import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import bs58 from "bs58";

// Load Environment
dotenv.config();

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

// Sanitize HTML to prevent XSS
const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Validate numeric input
const validateThreshold = (
  value: string | undefined,
  defaultVal: number
): number => {
  const parsed = parseFloat(value || "");
  if (isNaN(parsed) || parsed <= 0 || parsed > 2) {
    console.warn(`Invalid threshold, using default: ${defaultVal}`);
    return defaultVal;
  }
  return parsed;
};

// Rate limiter for Telegram API
const telegramRateLimiter = {
  lastSent: 0,
  minInterval: 1000, // 1 second minimum between messages
  canSend(): boolean {
    const now = Date.now();
    if (now - this.lastSent < this.minInterval) return false;
    return true;
  },
  markSent() {
    this.lastSent = Date.now();
  },
};

// ═══════════════════════════════════════════════════════════
// 1️⃣ CONFIGURATION
// ═══════════════════════════════════════════════════════════

// Telegram Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const LIQUIDATION_THRESHOLD = validateThreshold(
  process.env.LIQUIDATION_THRESHOLD,
  1.05
);

// Trusted RPCs - use only trusted RPCs
const TRUSTED_RPCS = [
  {
    url: process.env.RPC_URL || "https://api.devnet.solana.com",
    name: "Primary",
  },
];

// Known trusted RPCs for devnet (whitelist)
const DEVNET_TRUSTED_RPCS = [
  "https://api.devnet.solana.com",
  "https://devnet.genesysgo.net",
];

// Fallback RPCs - only for devnet or known RPCs
const FALLBACK_RPCS =
  process.env.NODE_ENV === "production"
    ? [] // Production: no fallback for security
    : [
        {
          url: process.env.FALLBACK_RPC,
          name: "Ankr",
          trusted: DEVNET_TRUSTED_RPCS.includes(process.env.FALLBACK_RPC || ""),
        },
        {
          url: process.env.FALLBACK2_RPC,
          name: "Pocket",
          trusted: DEVNET_TRUSTED_RPCS.includes(
            process.env.FALLBACK2_RPC || ""
          ),
        },
      ].filter(
        (r) => r.url && (r.trusted || process.env.NODE_ENV !== "production")
      );

// RPC with automatic fallback - use only trusted RPCs
const getConnection = (): Connection => {
  const allRpcs = [...TRUSTED_RPCS, ...FALLBACK_RPCS].filter((r) => r.url);

  for (const rpc of allRpcs) {
    if (rpc.url) {
      console.log(`Using RPC: ${rpc.name}`);
      return new Connection(rpc.url, { commitment: "confirmed" });
    }
  }
  throw new Error("No trusted RPC available");
};

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou"
);
const PYTH_SOL_USD = new PublicKey(
  "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
); // Devnet SOL/USD

// ═══════════════════════════════════════════════════════════
// 2️⃣ TELEGRAM ALERT FUNCTIONS 📱
// ═══════════════════════════════════════════════════════════

async function sendTelegramMessage(
  message: string,
  parseMode: "HTML" | "Markdown" = "HTML"
) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ Telegram not configured - skipping alert");
    return;
  }

  // Rate limiting
  if (!telegramRateLimiter.canSend()) {
    console.warn("⚠️ Telegram rate limited, skipping message");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true, // Security: prevent link preview attacks
      }),
    });
    telegramRateLimiter.markSent();
    console.log("✅ Telegram message sent");
  } catch (err) {
    console.error("❌ Telegram failed:", err);
  }
}

async function sendLiquidationAlert(
  healthFactor: number,
  solPrice: number,
  collateralAmount: number,
  debtAmount: number,
  walletAddress: string,
  txSignature?: string
) {
  const status =
    healthFactor < 1.0
      ? "🚨 LIQUIDATED!"
      : "⚠️ Near Liquidation (Low Health Factor)";

  // Sanitize all user-controlled data before rendering as HTML
  const safeWallet = sanitizeHtml(walletAddress);
  const safeSignature = txSignature ? sanitizeHtml(txSignature) : "";

  const solscanLink = safeSignature
    ? `https://solscan.io/tx/${safeSignature}`
    : `https://solscan.io/account/${safeWallet}`;

  const message = `
${status}

📊 Health Factor: <b>${sanitizeHtml(healthFactor.toFixed(3))}</b>
💰 SOL Price: <b>$${sanitizeHtml(solPrice.toFixed(2))}</b>
🏦 Collateral: <b>${sanitizeHtml(collateralAmount.toFixed(4))} SOL</b>
💸 Debt: <b>${sanitizeHtml(debtAmount.toFixed(2))} USDC</b>
👤 Wallet: <code>${safeWallet}</code>

🔗 View: ${solscanLink}
  ⏰ Time: ${new Date().toLocaleString("en-US", { timeZone: "UTC" })}

#GinvaKeeper #LiquidationAlert
  `.trim();

  await sendTelegramMessage(message);
}

async function sendStartupAlert() {
  const message = `
🚀 <b>GINVA KEEPER BOT STARTED</b>

🔧 RPC: ${RPC_URL}
📦 Program: ${PROGRAM_ID.toString()}
⚡ Liquidation Threshold: ${LIQUIDATION_THRESHOLD}

Bot is now monitoring for liquidation opportunities...
  `.trim();

  await sendTelegramMessage(message);
}

// ═══════════════════════════════════════════════════════════
// 3️⃣ INITIALIZE CONNECTION
// ═══════════════════════════════════════════════════════════

// Load wallet from environment variable (base58 encoded) - more secure than file
const getWalletFromEnv = (): Wallet => {
  const privateKeyBase58 = process.env.PRIVATE_KEY;

  if (!privateKeyBase58) {
    // Fallback to file-based keypair (for backwards compatibility)
    const keypairPath = process.env.KEYPAIR_PATH || "./keypair.json";
    console.warn(
      "⚠️ Using file-based keypair (deprecated). Set PRIVATE_KEY in .env for better security."
    );
    try {
      const secretKey = Uint8Array.from(
        JSON.parse(fs.readFileSync(keypairPath, "utf8"))
      );
      return new Wallet(Keypair.fromSecretKey(secretKey));
    } catch (e) {
      throw new Error(
        "No wallet configured. Set PRIVATE_KEY env var or provide keypair.json"
      );
    }
  }

  // Decode base58 private key
  try {
    const secretKey = Uint8Array.from(bs58.decode(privateKeyBase58));
    return new Wallet(Keypair.fromSecretKey(secretKey));
  } catch (e) {
    throw new Error("Invalid PRIVATE_KEY format. Use base58 encoded string.");
  }
};

// Load IDL
let idl: any;
try {
  idl = JSON.parse(fs.readFileSync("./ginva.json", "utf8"));
} catch (e) {
  console.warn("⚠️ ginva.json not found. Program methods may not work.");
  idl = null;
}

const connection = getConnection();
const wallet = getWalletFromEnv();
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});

const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(`🏪 Free-for-All Bot Started!`);
console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
console.log(`🏃‍♂️ Race to buy! Checking every 2 seconds...`);

// Send startup notification
sendStartupAlert();

// ═══════════════════════════════════════════════════════════
// 3️⃣ MAIN LOOP
// ═══════════════════════════════════════════════════════════
async function main() {
  while (true) {
    try {
      await checkAndBuyFromStorefront();
    } catch (error) {
      console.error("❌ Error in main loop:", error);
    }

    // Wait 2 seconds before next check (Race condition!)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// ═══════════════════════════════════════════════════════════
// 4️⃣ CHECK AND BUY FROM STOREFRONT
// ═══════════════════════════════════════════════════════════
async function checkAndBuyFromStorefront() {
  console.log("\n🔍 Scanning for Pawn Shop opportunities...");

  // Fetch all LiquidationProcess accounts from Blockchain
  // @ts-ignore
  const allProcesses = await program.account.liquidationProcess.all();

  for (const process of allProcesses) {
    const data = process.account;
    const pubkey = process.publicKey;

    // 🏪 FREE-FOR-ALL OPPORTUNITY (IMMEDIATE!)
    const isTriggered = data.status === 1; // 1 = Triggered
    const notSwappedYet = !data.swapped;

    // Priority 1: Buy Storefront (IMMEDIATE - no waiting)
    if (isTriggered && notSwappedYet) {
      const seizedAmount = data.seizedCollateralAmount as any;
      console.log(`\n🏪 OPPORTUNITY: ${pubkey.toBase58()}`);
      console.log(`   💎 Seized: ${seizedAmount.toNumber() / 1e9} SOL`);
      console.log(`   💰 Discount: 6% IMMEDIATE!`);
      console.log(`   🏃‍♂️ RACE ON - Anyone can buy!`);

      try {
        await buyFromStorefront(pubkey, data);
        console.log(`   🎉 SUCCESS! You got the deal!`);
      } catch (e: any) {
        const errorMsg = e.message || String(e);
        // Distinguish between "race lost" vs real errors
        if (
          errorMsg.includes("0x0") ||
          errorMsg.includes("already") ||
          errorMsg.includes("AccountInUse")
        ) {
          console.log(`   ⚠️ Someone else was faster!`);
        } else {
          console.error(`   ❌ Transaction failed:`, errorMsg);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 5️⃣ Buy From Storefront (6% discount) 🏪
// ═══════════════════════════════════════════════════════════
async function buyFromStorefront(liquidationPda: PublicKey, processData: any) {
  console.log("🏪 Executing buy transaction...");

  // Find required PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [seizedAuth] = PublicKey.findProgramAddressSync(
    [Buffer.from("seized_auth")],
    program.programId
  );

  const [processingAuth] = PublicKey.findProgramAddressSync(
    [Buffer.from("processing_auth")],
    program.programId
  );

  // Find Token Accounts
  const seizedVault = await getAssociatedTokenAddress(
    processData.collateralMint,
    seizedAuth,
    true
  );

  const processingVault = await getAssociatedTokenAddress(
    processData.loanMint,
    processingAuth,
    true
  );

  const callerUsdcAccount = await getAssociatedTokenAddress(
    processData.loanMint,
    wallet.publicKey
  );

  // Create ATA if not exists
  const tx = new Transaction();
  const callerUsdcInfo = await connection.getAccountInfo(callerUsdcAccount);
  if (!callerUsdcInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        callerUsdcAccount,
        wallet.publicKey,
        processData.loanMint
      )
    );
  }

  console.log("   📝 Calling Smart Contract to buy...");
  console.log("   ⚡ SPEED IS KEY - First come, first served!");

  // Send Transaction to Smart Contract
  const executeTx = await program.methods
    .buyFromStorefront()
    .accounts({
      caller: wallet.publicKey,
      liquidationProcess: liquidationPda,
      systemConfig: configPda,
      seizedAssetsAuthority: seizedAuth,
      seizedAssetsVault: seizedVault,
      processingVault: processingVault,
      processingVaultAuthority: processingAuth,
      callerUsdcAccount: callerUsdcAccount,
      // Note: For Storefront, we don't need jupiterProgram
      // But keeping it for compatibility
      jupiterProgram: PROGRAM_ID, // placeholder
      pythPriceFeed: PYTH_SOL_USD,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log(`   🎉 TRANSACTION SUCCESS!`);
  console.log(`   💰 You got 6% discount!`);
  console.log(
    `   🔗 View: https://explorer.solana.com/tx/${executeTx}?cluster=devnet`
  );
}

// ═══════════════════════════════════════════════════════════
// 6️⃣ START BOT 🚀
// ═══════════════════════════════════════════════════════════
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/*
📋 Pawn Shop Bot - Free-for-All Model:

🎯 New Flow:
1. trigger_liquidation occurs → Storefront opens IMMEDIATELY (6% discount)
2. Both Bot and regular humans can buy - no waiting!
3. Faster buyer wins - no exclusive rights

⚡ Speed is key:
- Bot checks every 2 seconds (very fast)
- Faster buyers get the deal
- No 24-hour lock-in period

💡 Strategy:
- Like an auction with instant buyout
- Both protocol and humans have equal opportunity
- Frontend may allow manual clicking
- Bot = "fastest buyer"
*/
