// Landing Page Component
import { useState, useEffect } from "react";
import { Page } from "../types";
import {
  LANDING_STATS,
  LANDING_FEATURES,
  LANDING_STEPS,
  KEEPER_INFO,
} from "../data/mock";
import {
  FiLock,
  FiShield,
  FiActivity,
  FiZap,
  FiCpu,
  FiGlobe,
  FiCheck,
  FiArrowRight,
  FiDownload,
  FiDollarSign,
  FiUnlock,
  FiShoppingBag,
  FiList,
  FiTarget,
  FiShoppingCart,
  FiAlertCircle,
  FiTrendingDown,
  FiCircle,
  FiCreditCard,
  FiAward,
} from "react-icons/fi";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  "🔒": <FiLock size={24} />,
  "🛡️": <FiShield size={24} />,
  "🌿": <FiActivity size={24} />,
  "⚡": <FiZap size={24} />,
  "🤖": <FiCpu size={24} />,
  "🌐": <FiGlobe size={24} />,
  "🔮": <FiGlobe size={24} />,
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  "📥": <FiDownload size={24} />,
  "💵": <FiDollarSign size={24} />,
  "🔓": <FiUnlock size={24} />,
};

const KEEPER_ICONS: Record<string, React.ReactNode> = {
  "🟢": <FiCircle size={24} color="#22c55e" />,
  "🔵": <FiCircle size={24} color="#3b82f6" />,
  "🟣": <FiCircle size={24} color="#a855f7" />,
};

const UI_ICONS: Record<string, React.ReactNode> = {
  "🏪": <FiShoppingBag size={20} />,
  "📋": <FiList size={20} />,
  "🎯": <FiTarget size={20} />,
  "🛒": <FiShoppingCart size={20} />,
  "🔴": <FiAlertCircle size={20} color="#ef4444" />,
  "📉": <FiTrendingDown size={20} />,
  "🔷": <FiAward size={20} color="#3b82f6" />,
  "✓": <FiCheck size={16} />,
  "🔐": <FiLock size={20} />,
  "🎫": <FiAward size={20} />,
  "💳": <FiCreditCard size={20} />,
};

interface LandingProps {
  onNavigate: (page: Page) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  const [liveTvl, setLiveTvl] = useState(12845620);
  const [liveUsers, setLiveUsers] = useState(1847);

  // Live data updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomize TVL by ±0.4%
      const tvlChange = (Math.random() - 0.5) * 0.008;
      setLiveTvl((prev) => Math.round(prev * (1 + tvlChange)));

      // Randomize users by ±0.2%
      const userChange = (Math.random() - 0.5) * 0.004;
      setLiveUsers((prev) => Math.round(prev * (1 + userChange)));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Format large numbers
  const formatTvl = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="hero-eyebrow">
            Solana Devnet · Program 2SiG...WKou
          </div>
          <h1 className="hero-title">
            Borrow against
            <br />
            your <em>crypto assets</em>
            <br />
            without selling.
          </h1>
          <p className="hero-subtitle">8% Fixed APR — No Surprises</p>
          <p className="hero-desc">
            GINVA is a decentralized pawnshop protocol on Solana. Deposit SOL,
            BTC, or ETH as collateral. Receive USDC instantly. Fixed rates,
            transparent liquidation, no hidden fees.
          </p>
          <div className="hero-cta">
            <button
              className="btn-primary"
              onClick={() => onNavigate("borrow")}
            >
              Start Borrowing →
            </button>
            <button
              className="btn-outline"
              onClick={() => onNavigate("support")}
            >
              Provide Liquidity
            </button>
          </div>
        </div>

        <div className="container">
          <div className="stats-row">
            {LANDING_STATS.map((s, i) => {
              // Update TVL stat with live data
              let value = s.value;
              let sub = s.sub;
              if (s.label === "Total Value Locked") {
                value = formatTvl(liveTvl);
                sub = "Live on Devnet";
              } else if (s.label === "Active Users") {
                value = liveUsers.toLocaleString();
                sub = "Currently borrowing";
              }
              return (
                <div className="stat-cell" key={i}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-sub">{sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="section">
        <div className="container">
          <div className="section-label">Why GINVA</div>
          <h2 className="section-title">
            Designed for <em>real borrowers</em>
            <br />
            not speculators
          </h2>
          <div className="features-grid">
            {LANDING_FEATURES.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">
                  {FEATURE_ICONS[f.icon] || <FiCheck size={24} />}
                </div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div
        className="section"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container">
          <div className="section-label">How it Works</div>
          <h2 className="section-title">
            3 steps to <em>borrow</em>
          </h2>
          <div className="steps-row">
            {LANDING_STEPS.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-num">0{i + 1}</div>
                <div className="step-icon">
                  {STEP_ICONS[s.icon] || <FiArrowRight size={24} />}
                </div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keepers */}
      <div className="section">
        <div className="container">
          <div className="section-label">Keeper Network</div>
          <h2 className="section-title">
            Three roles that keep
            <br />
            the <em>system honest</em>
          </h2>
          <div className="keeper-cards">
            {KEEPER_INFO.map((k) => (
              <div className={`keeper-card ${k.cls}`} key={k.cls}>
                <div className={`keeper-badge ${k.badge}`}>
                  {KEEPER_ICONS[k.icon] || k.icon} {k.label}
                </div>
                <div className="keeper-title">{k.title}</div>
                <div className="keeper-desc">{k.desc}</div>
                <div className="keeper-reward">
                  {k.reward.text} <span>{k.reward.highlight}</span>{" "}
                  {k.rewardSuffix}
                </div>
                <button
                  className="action-btn outline"
                  style={{ marginTop: 16 }}
                  onClick={() => onNavigate("keeper")}
                >
                  Join as Keeper →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              color: "var(--muted)",
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            Transparent · Verifiable · Institutional Standard
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,5vw,4rem)",
              fontWeight: 300,
              marginBottom: 32,
              lineHeight: 1.1,
            }}
          >
            Ready to put your
            <br />
            <em style={{ color: "var(--green)" }}>crypto to work?</em>
          </h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary"
              onClick={() => onNavigate("borrow")}
            >
              Borrow USDC
            </button>
            <button
              className="btn-outline"
              onClick={() => onNavigate("support")}
            >
              Earn as Supporter
            </button>
            <button
              className="btn-outline"
              onClick={() => onNavigate("keeper")}
            >
              Run a Keeper Bot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
