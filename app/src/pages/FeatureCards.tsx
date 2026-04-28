import { Shield, TrendingUp, Bot, Store, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: Shield,
    title: 'Borrow USDC',
    desc: 'Deposit SOL/JUP as collateral and borrow USDC at 8% fixed APR. Keep your assets, get the liquidity you need.',
    to: '/borrow',
  },
  {
    icon: TrendingUp,
    title: 'Earn Yield',
    desc: 'Deposit USDC into the lending pool and earn 8% APR. Withdraw anytime after 15 days with zero fees.',
    to: '/earn',
  },
  {
    icon: Bot,
    title: 'AI Agent Keeper',
    desc: 'Deploy human-controlled AI agents that monitor liquidations 24/7 and earn rewards for you.',
    to: '/ai-agent',
  },
  {
    icon: Store,
    title: 'Pawn Shop',
    desc: 'Buy liquidated assets at time-decay discounts up to 8%. Fair pricing, transparent mechanics.',
    to: '/pawn-shop',
  },
  {
    icon: Zap,
    title: 'Keeper Portal',
    desc: 'Three specialized roles work together for fair liquidation: Trigger, Storefront, and Finalize.',
    to: '/keeper',
  },
  {
    icon: Lock,
    title: 'Dual Protection',
    desc: '72-hour maturity grace period + immediate liquidation below Health Factor 100%. Your safety is hardcoded.',
    to: '/borrow',
  },
];

export default function FeatureCards() {
  return (
    <section className="relative px-[5vw] py-20 z-10">
      <div className="max-w-[1200px] mx-auto">
        <h2
          className="font-heading font-bold text-ginva-text text-center"
          style={{ fontSize: 'clamp(28px, 3vw, 36px)', letterSpacing: '-1px' }}
        >
          Protocol Features
        </h2>
        <p className="text-center text-ginva-text-secondary text-base mt-3 max-w-[560px] mx-auto">
          A complete decentralized lending ecosystem powered by AI agents and
          secured by immutable smart contracts.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="bg-ginva-bg-card border border-white/[0.08] p-6 rounded-xl hover:border-ginva-green/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            >
              <f.icon
                size={28}
                className="text-ginva-text-secondary group-hover:text-ginva-green transition-colors"
                style={{ filter: 'drop-shadow(0 0 5px rgba(250,104,73,0.3))' }}
              />
              <h3 className="font-heading font-medium text-lg text-ginva-text mt-4">
                {f.title}
              </h3>
              <p className="text-sm text-ginva-text-secondary mt-2 leading-relaxed">
                {f.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
