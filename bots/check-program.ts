import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('Ev9HTrf45JBM5PBvAG9v6AUb5cw4XeGgKXmrk7RtQm3D');

async function main() {
  const accounts = await connection.getProgramAccounts(programId);
  console.log('Program accounts found:', accounts.length);
  accounts.slice(0, 5).forEach((acc, i) => {
    console.log(`  ${i + 1}. ${acc.pubkey.toString()} (${acc.account.data.length} bytes)`);
  });
}

main();