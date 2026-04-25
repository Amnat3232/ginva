#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, ComputeBudgetProgram 
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
  
  const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
  const LOAN_MINT = new PublicKey("4zMMC9s63aj4emqG9q5ZtYGM3K1XP2eZCMC2Fs5hLmRd");
  
  // Check state
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("📊 Account state:");
  console.log("   System Config:", sysInfo ? `✅ ${sysInfo.lamports} lamports` : "❌ NOT EXISTS");
  console.log("   Proto Config:", protoInfo ? `✅ ${protoInfo.lamports} lamports` : "❌ NOT EXISTS");
  
  // Add funding if needed
  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
  
  // Fund accounts if needed
  if (!sysInfo || sysInfo.lamports === 0) {
    const rent = await connection.getMinimumBalanceForRentExemption(200);
    tx.add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: systemConfig, lamports: rent }));
    console.log("➕ Funding system config:", rent);
  }
  
  if (!protoInfo || protoInfo.lamports === 0) {
    const rent = await connection.getMinimumBalanceForRentExemption(500);
    tx.add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: protocolConfig, lamports: rent }));
    console.log("➕ Funding protocol config:", rent);
  }
  
  if (tx.instructions.length > 1) { // Compute budget + any transfers
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);
    
    console.log("📤 Funding accounts...");
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Funded!");
  }
  
  // Now initialize
  const initData = Buffer.from([0, 30, 0]); // instruction 0, fee 30 bps
  
  const initTx = new Transaction();
  initTx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
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
  
  console.log("\n📤 Calling InitializeSystem (400K compute units)...");
  
  try {
    const sig = await connection.sendTransaction(initTx, [wallet], { 
      preflightCommitment: "confirmed",
    });
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ InitializeSystem SUCCESS!");
    
    // Verify
    const [finalSys, finalProto] = await Promise.all([
      connection.getAccountInfo(systemConfig),
      connection.getAccountInfo(protocolConfig),
    ]);
    
    console.log("\n📊 Final state:");
    console.log("   System Config:", finalSys ? `✅ ${finalSys.lamports} lamports` : "❌");
    console.log("   Proto Config:", finalProto ? `✅ ${finalProto.lamports} lamports` : "❌");
    
    if (finalSys && finalSys.data.length >= 8) {
      const magic = new TextDecoder().decode(finalSys.data.slice(0, 8));
      console.log("   Magic:", magic);
    }
    
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    
    // Check error code
    if (e.message?.includes("0x")) {
      const code = parseInt(e.message.match(/0x([0-9a-f]+)/i)?.[1] || "0", 16);
      const errors: Record<number, string> = {
        0: "InvalidInstruction",
        1: "InvalidInput", 
        2: "InvalidAmount",
        3: "Unauthorized",
        4: "InvalidWalletAddress",
        9: "Uninitialized",
      };
      console.log("   Error code:", code, "-", errors[code] || "unknown");
    }
  }
}

main().catch(e => console.error("Fatal:", e));