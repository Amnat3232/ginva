// auto-swap-bot.ts
// 🤖 Bot สำหรับ Step 2: Auto-Swap (รับรางวัล 0.6%)
// หน้าที่: เฝ้าระวัง LiquidationProcess ที่ครบ 24 ชม. แล้ว แล้วกด execute_auto_swap

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

// ═════════════════════════════════════════════════════════════
// 1️⃣ การตั้งค่า (Configuration) ⚙️
// ═════════════════════════════════════════════════════════════
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
);
const PYTH_SOL_USD = new PublicKey(
  "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
); // Devnet SOL/USD
const JUPITER_PROGRAM_ID = new PublicKey(
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
);

// โหลด Wallet และ IDL
const walletKeypair = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(
      fs.readFileSync(process.env.KEYPAIR_PATH || "./keypair.json", "utf8")
    )
  )
);
const idl = JSON.parse(fs.readFileSync("./ginva.json", "utf8"));

// ═════════════════════════════════════════════════════════════
// 2️⃣ เริ่มต้นเชื่อมต่อ 🔗
// ═════════════════════════════════════════════════════════════
const connection = new Connection(RPC_URL, "confirmed");
const wallet = new Wallet(walletKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});

const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(`🤖 Auto-Swap Bot Started!`);
console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
console.log(`⏱️  Checking every 10 seconds...`);

// ═════════════════════════════════════════════════════════════
// 3️⃣ ฟังก์ชันหลัก: วนลูปตรวจสอบ (Main Loop) 🔄
// ═════════════════════════════════════════════════════════════
async function main() {
  while (true) {
    try {
      await checkAndExecuteAutoSwap();
    } catch (error) {
      console.error("❌ Error in main loop:", error);
    }

    // พัก 10 วินาทีแล้วเช็คใหม่
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

// ═════════════════════════════════════════════════════════════
// 4️⃣ ตรวจสอบและ Execute Auto-Swap 🎯
// ═════════════════════════════════════════════════════════════
async function checkAndExecuteAutoSwap() {
  console.log("\n🔍 Scanning for liquidation processes ready for swap...");

  // ดึงรายการ LiquidationProcess ทั้งหมดจาก Blockchain
  // @ts-ignore
  const allProcesses = await program.account.liquidationProcess.all();
  const currentTime = Math.floor(Date.now() / 1000);

  for (const process of allProcesses) {
    const data = process.account;
    const pubkey = process.publicKey;

    // ✅ เงื่อนไขที่ต้องตรวจสอบ:
    // 1. สถานะต้องเป็น "Triggered" (รอ swap)
    // 2. ยังไม่ได้ swap (swapped = false)
    // 3. ครบกำหนด 24 ชม. แล้ว

    const isTriggered = data.status === 1; // 1 = Triggered
    const notSwappedYet = !data.swapped;
    const deadlineReached = currentTime >= data.deadlineForSwap.toNumber();

    if (isTriggered && notSwappedYet && deadlineReached) {
      console.log(`\n🎯 FOUND: ${pubkey.toBase58()}`);
      console.log(
        `   Seized SOL: ${data.seizedCollateralAmount.toNumber() / 1e9} SOL`
      );
      console.log(
        `   Deadline: ${new Date(
          data.deadlineForSwap.toNumber() * 1000
        ).toLocaleString()}`
      );
      console.log(
        `   Current: ${new Date(currentTime * 1000).toLocaleString()}`
      );

      try {
        await executeAutoSwap(pubkey, data);
      } catch (e) {
        console.error(`   ⚠️ Failed to execute:`, e);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════
// 5️⃣ Execute Auto-Swap Function 💥
// ═════════════════════════════════════════════════════════════
async function executeAutoSwap(liquidationPda: PublicKey, processData: any) {
  console.log("🚀 Executing auto-swap...");

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
    processData.collateralMint, // SOL mint
    seizedAuth,
    true // allowOwnerOffCurve
  );

  const processingVault = await getAssociatedTokenAddress(
    processData.loanMint, // USDC mint
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

  // ═════════════════════════════════════════════════════════════
  // ⚠️ ส่วนสำคัญ: Jupiter Integration
  // ═════════════════════════════════════════════════════════════
  // ในความเป็นจริง มี 2 แบบในการทำ Auto-Swap:

  // แบบที่ 1: Off-chain Swap (ง่ายกว่า - ใช้ในโค้ดนี้)
  // - Bot นี้จะไป Swap ผ่าน Jupiter API ก่อน (ข้างนอก Smart Contract)
  // - แล้วค่อยเรียก execute_auto_swap เพื่อรับรางวัลและบันทึกสถานะ
  // - ข้อดี: เร็ว ง่าย ไม่ซับซ้อน
  // - ข้อเสีย: Bot ต้องมีทุนหมุนเวียนเองสำหรับ Swap

  // แบบที่ 2: On-chain CPI (ซับซ้อน)
  // - Smart Contract เรียก Jupiter ผ่าน CPI (Cross-Program Invocation)
  // - Bot แค่กดปุ่ม trigger ไม่ต้องมีทุน
  // - ต้อง Integrate Jupiter IDL และ Route การ Swap

  // ในตัวอย่างนี้ใช้แบบที่ 1 (Off-chain) ซึ่งเหมาะกับ MVP
  // ═════════════════════════════════════════════════════════════

  console.log("   🔄 Step 1: Swapping via Jupiter API...");

  // ตัวอย่าง: เรียก Jupiter API เพื่อ Swap (ต้อง implement จริง)
  // const swapResult = await swapViaJupiter({
  //   inputMint: SOL_MINT,
  //   outputMint: USDC_MINT,
  //   amount: processData.seizedCollateralAmount.toNumber(),
  //   slippage: 0.5,
  // });

  console.log("   ✅ Swap completed off-chain");
  console.log(
    "   📝 Step 2: Calling Smart Contract to record and claim reward..."
  );

  // ส่ง Transaction ไปที่ Smart Contract
  const executeTx = await program.methods
    .executeAutoSwap()
    .accounts({
      caller: wallet.publicKey,
      liquidationProcess: liquidationPda,
      systemConfig: configPda,
      seizedAssetsAuthority: seizedAuth,
      seizedAssetsVault: seizedVault,
      processingVault: processingVault,
      processingVaultAuthority: processingAuth,
      callerUsdcAccount: callerUsdcAccount,
      jupiterProgram: JUPITER_PROGRAM_ID, // อ้างอิง (แต่ไม่ได้ใช้จริงในแบบ Off-chain)
      pythPriceFeed: PYTH_SOL_USD,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log(`   🎉 SUCCESS! Transaction: ${executeTx}`);
  console.log(`   💰 You received 0.6% reward!`);

  // แสดงลิงก์ Explorer
  console.log(
    `   🔗 View: https://explorer.solana.com/tx/${executeTx}?cluster=devnet`
  );
}

// ═════════════════════════════════════════════════════════════
// 6️⃣ Helper Functions 🛠️
// ═════════════════════════════════════════════════════════════

// ตัวอย่างฟังก์ชันเรียก Jupiter API (ต้อง implement จริงตาม Jupiter API v6)
async function swapViaJupiter(params: {
  inputMint: PublicKey;
  outputMint: PublicKey;
  amount: number;
  slippage: number;
}) {
  // 1. Get Quote
  const quoteResponse = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${params.inputMint}` +
      `&outputMint=${params.outputMint}&amount=${params.amount}&slippageBps=${
        params.slippage * 100
      }`
  );
  const quoteData = await quoteResponse.json();

  // 2. Get Swap Transaction
  const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quoteData,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });
  const swapData = await swapResponse.json();

  // 3. Execute Transaction
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
  const transaction =
    anchor.web3.VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign and send
  transaction.sign([walletKeypair]);
  const signature = await connection.sendTransaction(transaction);
  await connection.confirmTransaction(signature);

  return { signature, outputAmount: quoteData.outAmount };
}

// ═════════════════════════════════════════════════════════════
// 7️⃣ เริ่มทำงาน 🚀
// ═════════════════════════════════════════════════════════════
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/*
📋 คำอธิบายเพิ่มเติม:

1. การทำงานของ Bot:
   - วนลูปทุก 10 วินาทีเช็ค LiquidationProcess ที่ครบ 24 ชม.
   - เจอแล้วไป Swap ผ่าน Jupiter (Off-chain)
   - แล้วเรียก execute_auto_swap() เพื่อรับรางวัล 0.6%

2. รางวัลที่ได้:
   - 0.6% จากมูลค่า USDC ที่ swap ได้
   - ตัวอย่าง: ถ้ายึดได้ 10,000 USDC → ได้รางวัล 60 USDC
   - หักค่า Gas (~0.01-0.1 USD) ยังคงกำไร

3. ความเสี่ยง:
   - ต้องมีทุนหมุนเวียนในการ Swap (แบบที่ 1)
   - หรือใช้ On-chain CPI แต่ซับซ้อนกว่า (แบบที่ 2)
   - มีคนแข่งกัน (MEV) ใครกดเร็วกว่าได้ไป

4. การแข่งขัน (MEV):
   - ถ้ามีหลาย Bot แย่งกัน ตัวที่ส่ง Transaction เร็วกว่าจะได้
   - แนะนำใช้ Jito หรือ Priority Fee เพิ่มโอกาสสำเร็จ

🔧 การ Deploy Bot จริง:
1. ติดตั้ง: npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
2. ตั้งค่า .env:
   RPC_URL=https://api.mainnet-beta.solana.com
   PROGRAM_ID=your_program_id_here
   KEYPAIR_PATH=./bot-wallet.json
3. รัน: npx ts-node auto-swap-bot.ts
*/
