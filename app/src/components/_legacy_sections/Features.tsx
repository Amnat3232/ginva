import GlassCard from "../components/ui/GlassCard";
import React from "react";

const LightningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  </svg>
);

const BanknotesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: "28px", height: "28px" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const features = [
  {
    icon: <ClockIcon />,
    title: "72-Hour Grace Period",
    description:
      "When collateral drops below threshold, you get 72 hours to add more collateral or repay. No instant liquidation.",
  },
  {
    icon: <ShieldIcon />,
    title: "No-Liquidation Guarantee",
    description:
      "As long as you respond within the grace period, your collateral is safe. Human-controlled AI Agents can help.",
  },
  {
    icon: <BanknotesIcon />,
    title: "8% Fixed APR",
    description:
      "Predictable, transparent interest rates. No variable rates, no surprises. Plan your finances with confidence.",
  },
  {
    icon: <LightningIcon />,
    title: "Instant Liquidity",
    description:
      "Get immediate access to liquidity against your crypto collateral in minutes, not days.",
  },
  {
    icon: <LockIcon />,
    title: "Non-Custodial",
    description:
      "Your keys, your crypto. We never take custody of your assets. True decentralization.",
  },
  {
    icon: <ChartIcon />,
    title: "Flexible Terms",
    description: "Choose your loan duration and LTV that fits your strategy.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      style={{
        padding: "120px 20px",
        background: "linear-gradient(180deg, #0F172A 0%, #0A0E17 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "900px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent)",
            marginBottom: "64px",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <h2
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#F8FAFC",
              marginBottom: "24px",
              letterSpacing: "-0.02em",
            }}
          >
            Why Choose <span style={{ color: "#F59E0B" }}>GINVA</span>
          </h2>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "18px",
              color: "rgba(248, 250, 252, 0.6)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            The fairest pawn shop on Solana. Borrow with peace of mind, not fear.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, index) => (
            <GlassCard
              key={index}
              style={{
                padding: "32px",
                background: "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "20px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget;
                target.style.borderColor = "rgba(245, 158, 11, 0.3)";
                target.style.transform = "translateY(-4px)";
                target.style.background = "rgba(245, 158, 11, 0.05)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = e.currentTarget;
                target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                target.style.transform = "translateY(0)";
                target.style.background = "rgba(255, 255, 255, 0.02)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  marginBottom: "24px",
                  color: "#F59E0B",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#F8FAFC",
                  marginBottom: "12px",
                  letterSpacing: "-0.01em",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: "15px",
                  color: "rgba(248, 250, 252, 0.6)",
                  lineHeight: 1.7,
                }}
              >
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>

        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.2), transparent)",
            marginTop: "80px",
          }}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Features;
