// pawn-shop-bot.ts
// 🏪 Bot สำหรับ "Free-for-All" Model (ใครก็ได้!)
// Flow: ทั้ง Bot และมนุษย์ซื้อได้ทันที - 6% discount
// นาทีที่ 5: ใครเร็วกว่าชนะ! ไม่มี exclusive rights

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

// โหลด Environment
dotenv.config();

// ═══════════════════════════════════════════════════════════
// 1️⃣ การตั้งค่า (Configuration) ⚙️
// ═══════════════════════════════════════════════════════════
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou"
);
const PYTH_SOL_USD = new PublicKey(
  "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
); // Devnet SOL/USD

// โหลด Wallet และ IDL
const walletKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(
      fs.readFileSync(process.env.KEYPAIR_PATH || "./keypair.json", "utf8")
    )
  )
);
const idl = JSON.parse(fs.readFileSync("./ginva.json", "utf8"));

// ═══════════════════════════════════════════════════════════
// 2️⃣ เริ่มต้นเชื่อมต่อ 🔗
// ═══════════════════════════════════════════════════════════
const connection = new Connection(RPC_URL, "confirmed");
const wallet = new Wallet(walletKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});

const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(`🏪 Free-for-All Bot Started!`);
console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
console.log(`🏃‍♂️ Race to buy! Checking every 2 seconds...`);

// ═══════════════════════════════════════════════════════════
// 3️⃣ ฟังก์ชันหลัก: วนลูปตรวจสอบ (Main Loop) 🔄
// ═══════════════════════════════════════════════════════════
async function main() {
  while (true) {
    try {
      await checkAndBuyFromStorefront();
    } catch (error) {
      console.error("❌ Error in main loop:", error);
    }

    // พัก 2 วินาทีแล้วเช็คใหม่ (Race condition!)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// ═══════════════════════════════════════════════════════════
// 4️⃣ ตรวจสอบและ Buy Storefront (Free-for-All!) 🎯
// ═══════════════════════════════════════════════════════════
async function checkAndBuyFromStorefront() {
  console.log("\n🔍 Scanning for Pawn Shop opportunities...");

  // ดึงรายการ LiquidationProcess ทั้งหมดจาก Blockchain
  // @ts-ignore
  const allProcesses = await program.account.liquidationProcess.all();
  const currentTime = Math.floor(Date.now() / 1000);

  for (const process of allProcesses) {
    const data = process.account;
    const pubkey = process.publicKey;

    // 🏪 FREE-FOR-ALL OPPORTUNITY (ทันที!)
    const isTriggered = data.status === 1; // 1 = Triggered
    const notSwappedYet = !data.swapped;

    // Priority 1: Buy Storefront (ทันที - ไม่ต้องรอ)
    if (isTriggered && notSwappedYet) {
      const seizedAmount = data.seizedCollateralAmount as any;
      console.log(`\n🏪 OPPORTUNITY: ${pubkey.toBase58()}`);
      console.log(`   💎 Seized: ${seizedAmount.toNumber() / 1e9} SOL`);
      console.log(`   💰 Discount: 6% IMMEDIATE!`);
      console.log(`   🏃‍♂️ RACE ON - Anyone can buy!`);

      try {
        await buyFromStorefront(pubkey, data);
        console.log(`   🎉 SUCCESS! You got the deal!`);
      } catch (e) {
        console.error(`   ⚠️ Someone else was faster!`, e);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 5️⃣ Buy From Storefront (6% discount) 🏪
// ═══════════════════════════════════════════════════════════
async function buyFromStorefront(liquidationPda: PublicKey, processData: any) {
  console.log("🏪 Executing buy transaction...");

  // หา PDA ต่างๆ ที่ต้องใช้
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

  // หา Token Accounts
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

  // ถ้ายังไม่มี ATA ให้สร้างก่อน
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

  // ส่ง Transaction ไปที่ Smart Contract
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
// 6️⃣ เริ่มทำงาน 🚀
// ═══════════════════════════════════════════════════════════
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/*
📋 Pawn Shop Bot - Free-for-All Model:

🎯 Flow ใหม่:
1. trigger_liquidation เกิด → Storefront เปิดทันที (6% discount)
2. ทั้ง Bot และมนุษย์ทั่วไปซื้อได้ - ไม่ต้องรอ!
3. ใครเร็วกว่าชนะ - ไม่มี exclusive rights

⚡ ความไวคือพระเทพ:
- Bot check ทุก 2 วินาที (เร็วมาก)
- ใครเห็นโอกาสเร็วกว่าซื้อได้เลย
- ไม่มีระยะเวลา lock-in 24 ชม.

💡 กลยุท:
- เหมือนการประมูลของดีที่มีคนแย่งชิง
- ทั้งที่และมนุษย์มีโอกาสเท่ากัน
- ตัวจริงอาจมี frontend ให้คนคลิกซื้อ
- Bot คือ "คนที่เร็วที่สุด"
*/
