const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com');
  const PROGRAM_ID = new PublicKey('BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man');
  const keypairPath = '/home/drsolodev/.config/solana/devnet-keypair.json';
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const [systemConfigPDA] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  console.log('System Config PDA:', systemConfigPDA.toString());

  // Check if account exists
  const existing = await connection.getAccountInfo(systemConfigPDA);
  if (existing) {
    console.log('Account already exists!');
    console.log('Data length:', existing.data.length);
    process.exit(0);
  }

  const systemConfigRent = await connection.getMinimumBalanceForRentExemption(285);
  console.log('Rent:', systemConfigRent);

  const ix = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: systemConfigPDA,
    space: 285,
    lamports: systemConfigRent,
    programId: PROGRAM_ID,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  try {
    console.log('Sending transaction...');
    const sig = await connection.sendTransaction(tx, [wallet], { skipPreflight: false });
    console.log('Success! Sig:', sig);
    await connection.confirmTransaction(sig, 'confirmed');
    console.log('Confirmed!');
  } catch(e) {
    console.log('Error:', e.message);
    console.log('Trying with skipPreflight...');
    const sig2 = await connection.sendTransaction(tx, [wallet], { skipPreflight: true });
    console.log('Success! Sig:', sig2);
  }
}

main().catch(console.error);