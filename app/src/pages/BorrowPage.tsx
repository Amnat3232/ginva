import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { Shield, Info, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, BN, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../idl/ginva.json';

const LTV_PRESETS = [
  { label: 'Safe 20%', value: 20, color: 'text-ginva-green', bg: 'bg-ginva-green/20', border: 'border-ginva-green/50' },
  { label: 'Standard 40%', value: 40, color: 'text-ginva-yellow', bg: 'bg-ginva-yellow/20', border: 'border-ginva-yellow/50' },
  { label: 'Max 60%', value: 60, color: 'text-ginva-red', bg: 'bg-ginva-red/20', border: 'border-ginva-red/50' },
];

const MOCK_LOANS = [
  { asset: 'SOL', collateral: '50.0 SOL', borrowed: '$2,450.00', hf: '2.45', maturity: '12 days', status: 'Active' as const },
  { asset: 'JUP', collateral: '1,200 JUP', borrowed: '$480.00', hf: '1.12', maturity: '3 days', status: 'Grace' as const },
];

export default function BorrowPage() {
  const { connected: storeConnected, connect } = useWalletStore();
  const wallet = useWallet();
  const connected = wallet.connected || storeConnected;

  const [collateral, setCollateral] = useState('');
  const [ltv, setLtv] = useState(40);
  const [collateralType, setCollateralType] = useState<'SOL' | 'JUP'>('SOL');
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const PROGRAM_ID = new PublicKey('DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47');
  const SOL_PRICE = 68.25;

  const checkAndInitAccount = async (connection: Connection, program: Program, user: PublicKey) => {
    const [loanAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('loan'), user.toBuffer()],
      PROGRAM_ID
    );

    try {
      const accountInfo = await connection.getAccountInfo(loanAccount);
      return accountInfo !== null;
    } catch {
      // Account doesn't exist, return false to create it
      return false;
    }
  };

  const executeBorrow = async () => {
    if (!wallet.publicKey || !collateral || parseFloat(collateral) <= 0) return;

    setLoading(true);
    setError('');
    setTxSig('');
    setSuccess(false);

    try {
      const rpcUrl = import.meta.env.VITE_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
      const connection = new Connection(rpcUrl);

      const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
      const program = new Program(idl as any, PROGRAM_ID, provider);

      // Check if wallet has enough SOL for transaction fee
      const balance = await connection.getBalance(wallet.publicKey!);
      if (balance < 5000) {
        throw new Error('Insufficient SOL for transaction. Need at least 0.005 SOL for gas.');
      }

      const amountLamports = new BN(parseFloat(collateral) * 1e9);

      // Derive loan account PDA
      const [loanAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan'), wallet.publicKey!.toBuffer()],
        PROGRAM_ID
      );

      const [systemConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from('system_config')],
        PROGRAM_ID
      );

      // Verify system config exists
      const configInfo = await connection.getAccountInfo(systemConfig);
      if (!configInfo) {
        throw new Error('System not initialized yet. Please wait for admin to initialize.');
      }

      // Check if loan account exists, if not this will create it on-chain
      const loanExists = await checkAndInitAccount(connection, program, wallet.publicKey!);

      // Deposit collateral transaction
      const tx = await program.methods
        .depositCollateral(amountLamports)
        .accounts({
          user: wallet.publicKey,
          loanAccount,
          systemConfig,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
        })
        .transaction();

      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction!(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      setTxSig(signature);
      setSuccess(true);

      // Reset form
      setCollateral('');
    } catch (err: any) {
      console.error('Borrow error:', err);
      setError(err.message || 'Transaction failed. Make sure you have enough SOL for gas.');
    } finally {
      setLoading(false);
    }
  };

  const solPrice = SOL_PRICE;
  const collateralValue = parseFloat(collateral || '0') * solPrice;
  const borrowAmount = collateralValue * (ltv / 100);
  const liquidationPrice = collateralValue > 0 ? (borrowAmount * 1.1) / parseFloat(collateral || '1') : 0;
  const healthFactor = borrowAmount > 0 ? collateralValue / borrowAmount : 0;

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-[5vw]">
        <div className="text-center max-w-md">
          <Shield size={48} className="text-ginva-green mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-ginva-text">Connect Your Wallet</h2>
          <p className="text-ginva-text-secondary mt-2 mb-6">Connect your Solana wallet to deposit collateral and borrow USDC.</p>
          <button onClick={connect} className="bg-ginva-green text-white px-8 py-3 rounded-lg font-medium hover:brightness-110 transition-all">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-[5vw] pt-[80px] pb-20">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-heading font-bold text-3xl text-ginva-text">Borrow USDC</h1>
        <p className="text-ginva-text-secondary mt-2">Deposit SOL/JUP as collateral and borrow USDC at 8% fixed APR.</p>


{/* Fairness Features Highlight */}
 <div className="flex flex-wrap gap-3 mt-4">
   <div className="bg-ginva-green/10 border border-ginva-green/30 rounded-lg px-4 py-2 flex items-center gap-2">
     <span className="w-2 h-2 bg-ginva-green rounded-full animate-pulse" />
     <span className="text-sm text-ginva-green font-medium">8% Fixed APR</span>
   </div>
   <div className="bg-ginva-blue/10 border border-ginva-blue/30 rounded-lg px-4 py-2 flex items-center gap-2">
     <svg className="w-4 h-4 text-ginva-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
     <span className="text-sm text-ginva-blue font-medium">72-Hour Grace Period</span>
   </div>
 </div>
        <div className="grid lg:grid-cols-[55%_45%] gap-6 mt-8">
          {/* Left: Collateral Deposit */}
          <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6">
            <h2 className="font-heading font-medium text-xl text-ginva-text mb-6">Deposit Collateral</h2>

            {/* Collateral Selector */}
            <div className="flex gap-3 mb-6">
              {(['SOL', 'JUP'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCollateralType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    collateralType === t
                      ? 'bg-ginva-green/20 border-ginva-green/50 text-ginva-green'
                      : 'bg-ginva-bg-secondary border-white/[0.08] text-ginva-text-secondary hover:text-ginva-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ginva-text-secondary">Amount to deposit</span>
                <span className="text-ginva-text-muted font-mono text-xs">Balance: 12.45 {collateralType}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder={`0.00 ${collateralType}`}
                  className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-3 text-ginva-text font-mono text-lg outline-none focus:border-ginva-green/50 transition-colors"
                />
                <button
                  onClick={() => setCollateral('12.45')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ginva-green hover:underline"
                >
                  MAX
                </button>
              </div>
              <div className="text-xs text-ginva-text-muted mt-1 font-mono">
                ≈ ${collateralValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* LTV Selector */}
            <div className="mb-6">
              <label className="text-sm text-ginva-text-secondary mb-3 block">Loan-to-Value (LTV)</label>
              <div className="flex gap-2 mb-3">
                {LTV_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setLtv(p.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      ltv === p.value
                        ? `${p.bg} ${p.border} ${p.color}`
                        : 'bg-ginva-bg-secondary border-white/[0.08] text-ginva-text-secondary'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={ltv}
                onChange={(e) => setLtv(Number(e.target.value))}
                className="w-full accent-ginva-green"
              />
              <div className="text-center font-mono text-sm text-ginva-text mt-1">{ltv}% LTV</div>
            </div>

            <button className="w-full bg-ginva-green text-white py-3 rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50">
              Deposit Collateral
            </button>
          </div>

          {/* Right: Loan Preview */}
          <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6">
            <h2 className="font-heading font-medium text-xl text-ginva-text mb-6">Loan Preview</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text-secondary">Collateral Value</span>
                <span className="font-mono text-sm text-ginva-text">${collateralValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text-secondary">Borrow Amount</span>
                <span className="font-mono text-sm text-ginva-green font-medium">{borrowAmount > 0 ? borrowAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} USDC</span>
              </div>
              <div className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text-secondary">Interest Rate</span>
                <span className="font-mono text-sm text-ginva-green">8% APR</span>
              </div>
              <div className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text-secondary flex items-center gap-1">
                  Health Factor <Info size={12} className="text-ginva-text-muted" />
                </span>
                <span className={`font-mono text-sm font-medium ${healthFactor >= 2 ? 'text-ginva-green' : healthFactor >= 1.5 ? 'text-ginva-yellow' : 'text-ginva-red'}`}>
                  {healthFactor > 0 ? healthFactor.toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text-secondary">Liquidation Price</span>
                <span className="font-mono text-sm text-ginva-red">${liquidationPrice.toFixed(2)}/{collateralType}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-ginva-text-secondary">Maturity</span>
                <span className="font-mono text-sm text-ginva-text">30 days + 72h grace</span>
              </div>
            </div>

            {/* Risk Meter */}
            <div className="mt-6">
              <div className="h-2 rounded-full bg-gradient-to-r from-ginva-green via-ginva-yellow to-ginva-red relative">
                {ltv > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg"
                    style={{ left: `${(ltv / 60) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-ginva-text-muted mt-1">
                <span>Safe</span>
                <span>Caution</span>
                <span>Danger</span>
              </div>
            </div>

<button onClick={executeBorrow} disabled={!collateral || parseFloat(collateral) <= 0 || loading} className="w-full bg-ginva-green text-white py-3 rounded-lg font-medium hover:brightness-110 transition-all mt-6 disabled:opacity-50 flex items-center justify-center gap-2">
  {loading && <Loader2 className="animate-spin" size={18} />}
  {loading ? 'Processing...' : 'Deposit & Borrow'}
</button>
{error && <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
{success && txSig && <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"><p className="text-green-400 text-sm font-medium">Success!</p><a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-green-300 text-xs hover:underline">View on Explorer</a></div>}
          </div>
        </div>

        {/* Active Loans */}
        <div className="mt-12">
          <h2 className="font-heading font-medium text-xl text-ginva-text mb-4">Your Active Loans</h2>
          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-ginva-bg-secondary text-xs font-semibold text-ginva-text-secondary uppercase tracking-wider">
              <span>Asset</span>
              <span>Collateral</span>
              <span>Borrowed</span>
              <span>Health Factor</span>
              <span>Maturity</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {MOCK_LOANS.map((loan, i) => (
              <div
                key={i}
                className="grid grid-cols-7 gap-4 px-6 py-4 bg-ginva-bg-card items-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-sm text-ginva-text font-medium">{loan.asset}</span>
                <span className="font-mono text-xs text-ginva-text">{loan.collateral}</span>
                <span className="font-mono text-xs text-ginva-text">{loan.borrowed}</span>
                <span className={`font-mono text-xs font-medium ${parseFloat(loan.hf) > 1.5 ? 'text-ginva-green' : parseFloat(loan.hf) > 1.1 ? 'text-ginva-yellow' : 'text-ginva-red'}`}>
                  {loan.hf}
                </span>
                <span className="font-mono text-xs text-ginva-text">{loan.maturity}</span>
                <span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    loan.status === 'Active' ? 'bg-ginva-green/20 text-ginva-green' : 'bg-ginva-yellow/20 text-ginva-yellow'
                  }`}>
                    {loan.status}
                  </span>
                </span>
                <div className="flex gap-2 justify-end">
                  <button className="text-xs bg-ginva-bg-tertiary text-ginva-text px-3 py-1.5 rounded hover:bg-ginva-green/20 transition-colors">Repay</button>
                  <button className="text-xs bg-ginva-bg-tertiary text-ginva-text px-3 py-1.5 rounded hover:bg-ginva-green/20 transition-colors">Extend</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
