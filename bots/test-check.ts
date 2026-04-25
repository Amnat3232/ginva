import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

async function main() {
  const programId = new PublicKey('HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj');
  const connection = new Connection(clusterApiUrl('devnet'));
  const account = await connection.getAccountInfo(programId);
  console.log('✅ Program exists:', !!account);
  console.log('✅ Executable:', account?.executable);
  console.log('✅ Owner:', account?.owner?.toString());
}

main();
