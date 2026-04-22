import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { Shield, Info } from 'lucide-react';

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
  const { connected, connect } = useWalletStore();
  const [collateral, setCollateral] = useState('');
  const [ltv, setLtv] = useState(40);
  const [collateralType, setCollateralType] = useState<'SOL' | 'JUP'>('SOL');

  const solPrice = 68.25;
  const collateralValue = parseFloat(collateral || '0') * solPrice;
  const borrowAmount = collateralValue * (ltv / 100);
  const liquidationPrice = collateralValue > 0 ? (borrowAmount * 1.1) / parseFloat(collateral || '1') : 0;
  const healthFactor = borrowAmount > 0 ? collateralValue / borrowAmount : 0;

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-[5vw]">
        <div className="text-center max-w-md">
          <Shield size={48} className="text-ginva-orange mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-ginva-text">Connect Your Wallet</h2>
          <p className="text-ginva-text-secondary mt-2 mb-6">Connect your Solana wallet to deposit collateral and borrow USDC.</p>
          <button onClick={connect} className="bg-ginva-orange text-white px-8 py-3 rounded-lg font-medium hover:brightness-110 transition-all">
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
                      ? 'bg-ginva-orange/20 border-ginva-orange/50 text-ginva-orange'
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
                  className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-3 text-ginva-text font-mono text-lg outline-none focus:border-ginva-orange/50 transition-colors"
                />
                <button
                  onClick={() => setCollateral('12.45')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ginva-orange hover:underline"
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
                className="w-full accent-ginva-orange"
              />
              <div className="text-center font-mono text-sm text-ginva-text mt-1">{ltv}% LTV</div>
            </div>

            <button className="w-full bg-ginva-orange text-white py-3 rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50">
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
                <span className="font-mono text-sm text-ginva-orange font-medium">{borrowAmount > 0 ? borrowAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} USDC</span>
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

            <button
              className="w-full bg-ginva-orange text-white py-3 rounded-lg font-medium hover:brightness-110 transition-all mt-6 disabled:opacity-50"
              disabled={!collateral || parseFloat(collateral) <= 0}
            >
              Borrow USDC
            </button>
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
                  <button className="text-xs bg-ginva-bg-tertiary text-ginva-text px-3 py-1.5 rounded hover:bg-ginva-orange/20 transition-colors">Repay</button>
                  <button className="text-xs bg-ginva-bg-tertiary text-ginva-text px-3 py-1.5 rounded hover:bg-ginva-orange/20 transition-colors">Extend</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
