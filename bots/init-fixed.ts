#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram 
} from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const secretKey = JSON.parse(fs.readFileSync("/home/drsolodev/.config/solana/devnet-keypair.json", "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  // Derive PDAs
  const [systemConfig] = PublicKey.findProgramAddressSync([Buffer.from("system_config")], PROGRAM_ID);
  const [protocolConfig] = PublicKey.findProgramAddressSync([Buffer.from("protocol_config")], PROGRAM_ID);
  const [opsWallet] = PublicKey.findProgramAddressSync([Buffer.from("ops_wallet")], PROGRAM_ID);
  const [reserveWallet] = PublicKey.findProgramAddressSync([Buffer.from("reserve_wallet")], PROGRAM_ID);
  
  const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // wSOL
  const LOAN_MINT = new PublicKey("4zMMC9s63aj4emqG9q5ZtYGM3K1XP2eZCMC2Fs5hLmRd"); // devnet USDC
  
  // Check current state
  console.log("📊 Initial state...");
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  console.log("   System Config:", sysInfo ? `EXISTS (${sysInfo.lamports} lamports)` : "NOT EXISTS");
  console.log("   Proto Config:", protoInfo ? `EXISTS (${protoInfo.lamports} lamports)` : "NOT EXISTS");
  
  if (!sysInfo || sysInfo.lamports === 0 || !protoInfo || protoInfo.lamports === 0) {
    // Need to fund accounts first for them to "exist"
    const fundTx = new Transaction();
    
    // Fund system config (need ~200 bytes rent)
    if (!sysInfo || sysInfo.lamports === 0) {
      const rent = await connection.getMinimumBalanceForRentExemption(200);
      fundTx.add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: systemConfig,
        lamports: rent,
      }));
      console.log("➕ Funding system config:", rent, "lamports");
    }
    
    // Fund protocol config (need ~500 bytes)
    if (!protoInfo || protoInfo.lamports === 0) {
      const rent = await connection.getMinimumBalanceForRentExemption(500);
      fundTx.add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: protocolConfig,
        lamports: rent,
      }));
      console.log("➕ Funding protocol config:", rent, "lamports");
    }
    
    if (fundTx.instructions.length > 0) {
      fundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      fundTx.feePayer = wallet.publicKey;
      fundTx.sign(wallet);
      
      console.log("📤 Funding accounts...");
      const sig = await connection.sendRawTransaction(fundTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Funded!");
    }
  }
  
  // Now call initialize - data is instruction byte (0) + deposit_fee (30 bps)
  const initData = Buffer.from([0, 30, 0]); // instruction 0, fee 30 in LE
  
  const initTx = new Transaction();
  initTx.add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: systemConfig, isSigner: false, isWritable: true },
      { pubkey: protocolConfig, isSigner: false, isWritable: true },
      { pubkey: opsWallet, isSigner: false, isWritable: true },
      { pubkey: reserveWallet, isSigner: false, isWritable: true },
      { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false },
      { pubkey: LOAN_MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: initData,
  });
  
  initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  initTx.feePayer = wallet.publicKey;
  
  console.log("\n📤 Calling InitializeSystem...");
  console.log("   Data:", initData.toString("hex"));
  console.log("   Accounts:", initTx.instructions[0].keys.map(k => k.pubkey.toString()).join(", "));
  
  try {
    const sig = await connection.sendTransaction(initTx, [wallet], { preflightCommitment: "confirmed" });
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Confirmed!");
    
    // Verify
    const [finalSys, finalProto] = await Promise.all([
      connection.getAccountInfo(systemConfig),
      connection.getAccountInfo(protocolConfig),
    ]);
    
    console.log("\n📊 Final state:");
    console.log("   System Config:", finalSys ? "✅ INITIALIZED" : "❌ FAILED");
    console.log("   Proto Config:", finalProto ? "✅ INITIALIZED" : "❌ FAILED");
    
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    if (e.message?.includes("0x")) {
      const code = parseInt(e.message.match(/0x([0-9a-f]+)/i)?.[1] || "0", 16);
      console.log("   Error code:", code, "=", code === 4 ? "Uninitialized" : code === 1 ? "InvalidInstruction" : "unknown");
    }
  }
}

main().catch(e => console.error("Fatal:", e));