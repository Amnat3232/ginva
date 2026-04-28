import { useState } from 'react';
import { Store, Clock, Tag, ShoppingCart } from 'lucide-react';

const LISTINGS = [
  { id: 1, symbol: 'SOL', name: 'Solana', originalValue: 1245.67, discountPrice: 1145.00, discount: 8.1, timeRemaining: '4h 23m', icon: '◎' },
  { id: 2, symbol: 'JUP', name: 'Jupiter', originalValue: 890.50, discountPrice: 845.97, discount: 5.0, timeRemaining: '12h 45m', icon: '♃' },
  { id: 3, symbol: 'SOL', name: 'Solana', originalValue: 2340.00, discountPrice: 2152.80, discount: 8.0, timeRemaining: '2h 10m', icon: '◎' },
  { id: 4, symbol: 'BONK', name: 'Bonk', originalValue: 45.20, discountPrice: 42.89, discount: 5.1, timeRemaining: '18h 30m', icon: '🔥' },
  { id: 5, symbol: 'JUP', name: 'Jupiter', originalValue: 1560.80, discountPrice: 1435.94, discount: 8.0, timeRemaining: '6h 15m', icon: '♃' },
  { id: 6, symbol: 'SOL', name: 'Solana', originalValue: 567.30, discountPrice: 521.92, discount: 8.0, timeRemaining: '1h 45m', icon: '◎' },
];

const FILTER_OPTIONS = ['All Assets', 'SOL', 'JUP', 'Recently Added', 'Biggest Discount'];

export default function PawnShopPage() {
  const [filter, setFilter] = useState('All Assets');

  const filtered = filter === 'All Assets' ? LISTINGS :
    filter === 'Biggest Discount' ? [...LISTINGS].sort((a, b) => b.discount - a.discount) :
    filter === 'Recently Added' ? [...LISTINGS].reverse() :
    LISTINGS.filter((l) => l.symbol === filter);

  return (
    <div className="min-h-screen px-[5vw] pt-[80px] pb-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Store size={28} className="text-ginva-green" />
          <h1 className="font-heading font-bold text-3xl text-ginva-text">Pawn Shop</h1>
        </div>
        <p className="text-ginva-text-secondary mt-1 max-w-[560px]">
          Buy liquidated assets at fair discounts. Time-decay pricing means better deals the longer you wait.
        </p>

        {/* Filters */}
        <div className="flex gap-2 mt-6 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                filter === f
                  ? 'bg-ginva-green/20 border-ginva-green/50 text-ginva-green'
                  : 'bg-ginva-bg-tertiary border-white/[0.08] text-ginva-text-secondary hover:text-ginva-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filtered.map((item) => (
            <div key={item.id} className="bg-ginva-bg-card border border-white/[0.08] rounded-xl overflow-hidden hover:border-ginva-green/30 transition-all duration-200">
              {/* Image Area */}
              <div className="h-[140px] bg-gradient-to-br from-ginva-bg-secondary to-ginva-bg-tertiary flex items-center justify-center relative">
                <span className="text-4xl opacity-30">{item.icon}</span>
                <div className="absolute top-3 right-3">
                  <span className="text-xs bg-ginva-green/20 text-ginva-green px-2 py-0.5 rounded-full font-medium">
                    -{item.discount}%
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading font-medium text-lg text-ginva-text">{item.symbol}</h3>
                  <span className="text-xs text-ginva-text-secondary">{item.name}</span>
                </div>
                <div className="text-sm text-ginva-text-secondary line-through">${item.originalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="font-mono text-xl text-ginva-green font-medium mt-1">
                  ${item.discountPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-ginva-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {item.timeRemaining}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Up to 8%
                  </span>
                </div>
                <button className="w-full bg-ginva-green text-white py-2.5 rounded-lg font-medium hover:brightness-110 transition-all mt-4 flex items-center justify-center gap-2">
                  <ShoppingCart size={14} />
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Time-Decay Explainer */}
        <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-8 mt-12 max-w-[800px] mx-auto">
          <h2 className="font-heading font-medium text-xl text-ginva-text mb-3">How Time-Decay Pricing Works</h2>
          <p className="text-sm text-ginva-text-secondary leading-relaxed mb-6">
            Assets start at full value and decrease in price over time. The discount increases linearly up to 8% maximum.
          </p>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-ginva-bg-tertiary -translate-y-1/2" />
            {[
              { time: '0h', discount: '0%', color: 'bg-ginva-green' },
              { time: '8h', discount: '2%', color: 'bg-ginva-yellow' },
              { time: '16h', discount: '5%', color: 'bg-ginva-green' },
              { time: '24h', discount: '8% max', color: 'bg-ginva-red' },
            ].map((stage, i) => (
              <div key={i} className="relative flex flex-col items-center z-10">
                <div className={`w-4 h-4 rounded-full ${stage.color} border-2 border-ginva-bg-card`} />
                <span className="text-xs text-ginva-text-secondary mt-2 font-mono">{stage.time}</span>
                <span className="text-xs text-ginva-text font-medium">{stage.discount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
