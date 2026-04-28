import { useWalletStore } from '../stores/walletStore';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Bot, Store, Clock, Sparkles } from 'lucide-react';

const STATS = [
  { label: 'Total Value Locked', value: '$2.4M', color: 'text-ginva-green' },
  { label: 'Active Loans', value: '184', color: 'text-ginva-green' },
  { label: 'AI Keepers', value: '23', color: 'text-ginva-blue' },
  { label: 'Fixed APR', value: '8%', color: 'text-ginva-green' },
];

export default function Hero() {
  const { connected } = useWalletStore();

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-[5vw] pt-[60px]">
      <div className="max-w-[1440px] mx-auto w-full">
        <div className="max-w-[640px]">
          <h1
            className="font-heading font-bold text-ginva-text"
            style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            AI Agent Income Engine
          </h1>
          <p className="mt-6 text-base text-ginva-text-secondary leading-relaxed max-w-[520px]">
            Fair Lending for Humans, Powered by AI. Deposit collateral, borrow
            USDC, and let AI agents earn for you.
          </p>
          <div className="flex gap-4 mt-8">
            {connected ? (
              <>
                <Link
                  to="/borrow"
                  className="inline-flex items-center gap-2 bg-ginva-green text-white px-6 py-3 rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  <Shield size={16} />
                  Start Borrowing
                </Link>
                <Link
                  to="/earn"
                  className="inline-flex items-center gap-2 bg-ginva-bg-tertiary border border-white/[0.08] text-ginva-text px-6 py-3 rounded-lg text-sm font-medium hover:border-ginva-green/50 transition-all"
                >
                  <TrendingUp size={16} />
                  Explore Earn
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => useWalletStore.getState().connect()}
                  className="inline-flex items-center gap-2 bg-ginva-green text-white px-6 py-3 rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  Connect Wallet
                </button>
                <Link
                  to="/pawn-shop"
                  className="inline-flex items-center gap-2 bg-ginva-bg-tertiary border border-white/[0.08] text-ginva-text px-6 py-3 rounded-lg text-sm font-medium hover:border-ginva-green/50 transition-all"
                >
                  <Store size={16} />
                  Browse Store
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {[
            { icon: Shield, label: 'Borrow', desc: 'Collateral → USDC', to: '/borrow' },
            { icon: TrendingUp, label: 'Earn', desc: 'Deposit → Yield', to: '/earn' },
            { icon: Store, label: 'Pawn Shop', desc: 'Buy at discount', to: '/pawn-shop' },
            { icon: Bot, label: 'AI Agent', desc: 'Deploy keeper', to: '/ai-agent' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-ginva-bg-secondary/50 backdrop-blur-sm border border-white/[0.08] p-5 rounded-xl hover:border-ginva-green/30 hover:-translate-y-1 transition-all duration-200 group"
            >
              <item.icon
                size={24}
                className="text-ginva-text-secondary group-hover:text-ginva-green transition-colors"
              />
              <div className="mt-3 font-heading font-medium text-ginva-text text-sm">
                {item.label}
              </div>
              <div className="text-xs text-ginva-text-secondary mt-1">
                {item.desc}
              </div>
            </Link>
          ))}
        </div>

        {/* Key Differentiators - GINVA Fairness Features */}
        <div className="grid md:grid-cols-2 gap-4 mt-12">
          <div className="bg-gradient-to-br from-ginva-green/20 to-ginva-green/5 border border-ginva-green/30 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ginva-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-ginva-green/20 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-2 text-ginva-green mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Fixed Rate</span>
              </div>
              <div className="font-mono text-4xl font-bold text-ginva-text">8% <span className="text-lg font-normal text-ginva-text-secondary">APR</span></div>
              <p className="text-sm text-ginva-text-secondary mt-2">No variable rates. No surprises. Just predictable returns.</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-ginva-green/20 to-ginva-green/5 border border-ginva-green/30 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ginva-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-ginva-green/20 transition-all" />
            <div className="relative">
              <div className="flex items-center gap-2 text-ginva-green mb-2">
                <Clock size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">72-Hour Grace Period</span>
              </div>
              <div className="font-mono text-4xl font-bold text-ginva-text">72h <span className="text-lg font-normal text-ginva-text-secondary">buffer</span></div>
              <p className="text-sm text-ginva-text-secondary mt-2">Time to top up before liquidation. Fairer than instant liquidations.</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-ginva-bg-secondary/50 backdrop-blur-sm border border-white/[0.08] p-4 rounded-xl"
            >
              <div className="text-xs text-ginva-text-secondary uppercase tracking-wider">
                {stat.label}
              </div>
              <div
                className={`font-mono text-xl font-medium mt-1 ${stat.color}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}