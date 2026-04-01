import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";

// Config
const PROGRAM_ID = new PublicKey("6xmu5eA6BPt6us4u2vi8xqiiu6VGiJ38yw4MT86wiUeC");
const RPC_URL = "https://api.devnet.solana.com";
const WALLET_PATH = process.env.HOME + "/.config/solana/id.json";

const connection = new Connection(RPC_URL, "confirmed");

// Load wallet
const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8"));
const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));

console.log("🔑 Wallet:", wallet.publicKey.toBase58());
console.log("📋 Program:", PROGRAM_ID.toBase58());

// ============================================
// Test Functions
// ============================================

async function airdropSOL(amount: number = 2) {
  console.log(`\n💧 Airdroping ${amount} SOL...`);
  const sig = await connection.requestAirdrop(wallet.publicKey, amount * 1e9);
  await connection.confirmTransaction(sig);
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("✅ Balance:", balance / 1e9, "SOL");
}

async function getTokenBalance(mint: PublicKey, owner: PublicKey) {
  try {
    const token = new Token(connection, mint, TOKEN_PROGRAM_ID, wallet);
    const account = await token.getOrCreateAssociatedAccountInfo(owner);
    return account.amount.toNumber();
  } catch {
    return 0;
  }
}

async function testInitialize() {
  console.log("\n📝 Test 1: Initialize Protocol...");

  // Find PDA for protocol state
  const [protocolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol")],
    PROGRAM_ID
  );

  console.log("   Protocol PDA:", protocolPDA.toBase58());

  // Check if already initialized
  const info = await connection.getAccountInfo(protocolPDA);
  if (info) {
    console.log("   ✅ Protocol already initialized");
    return protocolPDA;
  }

  // Initialize (mock - need actual instruction data)
  console.log("   ⚠️  Need to implement initialize instruction");
  return protocolPDA;
}

async function testDepositCollateral() {
  console.log("\n📝 Test 2: Deposit Collateral...");

  // Mock collateral - in real test would be SPL tokens
  const [userVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("   User Vault:", userVault.toBase58());
  console.log("   💰 Depositing 1 SOL as collateral...");

  // Transfer SOL to vault (mock)
  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: userVault,
      lamports: 1e9, // 1 SOL
    })
  );

  // await sendAndConfirmTransaction(connection, tx, [wallet]);
  console.log("   ⚠️  Deposit instruction not implemented yet");
}

async function testBorrow() {
  console.log("\n📝 Test 3: Borrow USDC...");

  // Mock borrow - would need actual borrow instruction
  console.log("   💳 Borrowing 50 USDC...");
  console.log("   ⚠️  Borrow instruction not implemented yet");
}

async function testLiquidation() {
  console.log("\n📝 Test 4: Test Liquidation...");

  // Mock liquidation check
  console.log("   🔥 Health factor check...");
  console.log("   ⚠️  Liquidation not implemented yet");
}

async function runTests() {
  console.log("===========================================");
  console.log("🧪 GINVA Protocol Test Suite");
  console.log("===========================================");

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("\n💰 Current Balance:", balance / 1e9, "SOL");

  // Run tests
  await testInitialize();
  await testDepositCollateral();
  await testBorrow();
  await testLiquidation();

  console.log("\n===========================================");
  console.log("✅ Tests Complete!");
  console.log("===========================================");
}

// Run
runTests().catch(console.error);
