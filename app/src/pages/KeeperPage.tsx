import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { Zap, ShoppingBag, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

const KEEPER_ROLES = [
  { icon: Zap, name: 'Keeper A (Trigger)', reward: '0.6%', desc: 'Monitor health, detect liquidation events', color: 'text-ginva-green', bg: 'bg-ginva-green/20' },
  { icon: ShoppingBag, name: 'Keeper B (Storefront)', reward: 'Up to 8% discount', desc: 'Buy with time-decay pricing', color: 'text-ginva-blue', bg: 'bg-ginva-blue/20' },
  { icon: CheckCircle, name: 'Keeper C (Finalize)', reward: '1.0 USDC/tx', desc: 'Complete settlement & distribute funds', color: 'text-ginva-orange', bg: 'bg-ginva-orange/20' },
];

const LIQUIDATIONS = [
  { borrower: '7x9K...3mP2', collateral: '25.5 SOL', loanValue: '$1,740.38', healthFactor: '0.95', role: 'A', action: 'Execute' },
  { borrower: 'Ab2C...4dE5', collateral: '100 JUP', loanValue: '$320.00', healthFactor: '0.88', role: 'B', action: 'Buy' },
  { borrower: 'Fg6H...7iJ8', collateral: '12.0 SOL', loanValue: '$818.40', healthFactor: '1.05', role: 'C', action: 'Finalize' },
  { borrower: 'Kl9M...0nO1', collateral: '50.0 SOL', loanValue: '$3,412.50', healthFactor: '0.92', role: 'A', action: 'Execute' },
];

const ACTIVITY_LOG = [
  { role: 'Keeper A', loan: '25.5 SOL', reward: '$10.44', date: '2026-04-19', status: 'Confirmed' as const },
  { role: 'Keeper C', loan: '12.0 SOL', reward: '1.0 USDC', date: '2026-04-18', status: 'Confirmed' as const },
];

export default function KeeperPage() {
  const { connected, connect } = useWalletStore();
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-[5vw]">
        <div className="text-center max-w-md">
          <Shield size={48} className="text-ginva-orange mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-ginva-text">Connect Your Wallet</h2>
          <p className="text-ginva-text-secondary mt-2 mb-6">Connect to participate in keeper liquidations and earn rewards.</p>
          <button onClick={connect} className="bg-ginva-orange text-white px-8 py-3 rounded-lg font-medium hover:brightness-110 transition-all">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const filteredLiquidations = showOnlyCritical
    ? LIQUIDATIONS.filter((l) => parseFloat(l.healthFactor) < 1.0)
    : LIQUIDATIONS;

  return (
    <div className="min-h-screen px-[5vw] pt-[80px] pb-20">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-heading font-bold text-3xl text-ginva-text">Keeper Portal</h1>
        <p className="text-ginva-text-secondary mt-2">
          Participate in fair liquidation. Three specialized roles, transparent rewards.
        </p>

        {/* Keeper Role Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {KEEPER_ROLES.map((role) => (
            <div key={role.name} className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6 hover:border-ginva-orange/30 transition-all">
              <div className={`w-10 h-10 ${role.bg} rounded-lg flex items-center justify-center`}>
                <role.icon size={20} className={role.color} />
              </div>
              <h3 className="font-heading font-medium text-ginva-text mt-4">{role.name}</h3>
              <div className={`font-mono text-lg ${role.color} mt-1`}>{role.reward}</div>
              <p className="text-xs text-ginva-text-secondary mt-2">{role.desc}</p>
            </div>
          ))}
        </div>

        {/* Liquidation Opportunities */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-medium text-xl text-ginva-text">Liquidation Opportunities</h2>
            <label className="flex items-center gap-2 text-sm text-ginva-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyCritical}
                onChange={(e) => setShowOnlyCritical(e.target.checked)}
                className="accent-ginva-orange"
              />
              Show only HF &lt; 100%
            </label>
          </div>
          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-ginva-bg-secondary text-xs font-semibold text-ginva-text-secondary uppercase tracking-wider">
              <span>Borrower</span>
              <span>Collateral</span>
              <span>Loan Value</span>
              <span>Health Factor</span>
              <span>Your Role</span>
              <span className="text-right">Action</span>
            </div>
            {filteredLiquidations.map((l, i) => (
              <div
                key={i}
                className={`grid grid-cols-6 gap-4 px-6 py-4 bg-ginva-bg-card items-center ${
                  parseFloat(l.healthFactor) < 1.0 ? 'bg-red-500/5' : ''
                }`}
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="font-mono text-xs text-ginva-text">{l.borrower}</span>
                <span className="font-mono text-xs text-ginva-text">{l.collateral}</span>
                <span className="font-mono text-xs text-ginva-text">{l.loanValue}</span>
                <span className={`font-mono text-xs font-medium ${
                  parseFloat(l.healthFactor) < 1.0 ? 'text-ginva-red' : 'text-ginva-yellow'
                }`}>
                  {parseFloat(l.healthFactor) < 1.0 && <AlertTriangle size={10} className="inline mr-1" />}
                  {l.healthFactor}
                </span>
                <span className="text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    l.role === 'A' ? 'bg-ginva-green/20 text-ginva-green' :
                    l.role === 'B' ? 'bg-ginva-blue/20 text-ginva-blue' :
                    'bg-ginva-orange/20 text-ginva-orange'
                  }`}>
                    {l.role}
                  </span>
                </span>
                <div className="text-right">
                  <button className="text-xs bg-ginva-orange text-white px-4 py-1.5 rounded hover:brightness-110 transition-all">
                    {l.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="mt-12">
          <h2 className="font-heading font-medium text-xl text-ginva-text mb-4">Your Keeper Activity</h2>
          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-ginva-bg-secondary text-xs font-semibold text-ginva-text-secondary uppercase tracking-wider">
              <span>Role</span>
              <span>Loan</span>
              <span>Reward</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {ACTIVITY_LOG.map((log, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 bg-ginva-bg-card items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm text-ginva-text">{log.role}</span>
                <span className="font-mono text-xs text-ginva-text">{log.loan}</span>
                <span className="font-mono text-xs text-ginva-green">{log.reward}</span>
                <span className="font-mono text-xs text-ginva-text-secondary">{log.date}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-ginva-green/20 text-ginva-green w-fit">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
