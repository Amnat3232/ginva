import { useEffect } from "react";
import GlassCard from "../components/GlassCard";
import gsap from "gsap";

const features = [
  {
    icon: "⚡",
    title: "Instant Liquidity",
    description:
      "Get immediate access to liquidity against your crypto collateral with minimal delays.",
  },
  {
    icon: "🛡️",
    title: "Security First",
    description:
      "Audited smart contracts with multi-sig protection and insurance coverage.",
  },
  {
    icon: "💰",
    title: "Zero Fees",
    description:
      "No hidden fees, no origination costs. Keep more of what you earn.",
  },
  {
    icon: "📊",
    title: "Flexible Terms",
    description: "Choose your loan duration and LTV that fits your strategy.",
  },
  {
    icon: "🔒",
    title: "Non-Custodial",
    description:
      "Your keys, your crypto. We never take custody of your assets.",
  },
  {
    icon: "📈",
    title: "Earn Yield",
    description:
      "Supply assets to our pools and earn competitive APY on your holdings.",
  },
];

const Features = () => {
  useEffect(() => {
    gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

  return (
    <section
      id="features"
      style={{
        padding: "100px 20px",
        background: "linear-gradient(180deg, #0f172a 0%, #0a0a0f 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 50%)",
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
            background:
              "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent)",
            marginBottom: "60px",
          }}
        />
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "white",
              marginBottom: "20px",
            }}
          >
            Why Choose <span style={{ color: "#f59e0b" }}>GINVA</span>
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.6)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Experience the future of decentralized lending with
            institutional-grade security
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}
        >
          {features.map((feature, index) => (
            <GlassCard key={index} className="feature-card">
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "20px",
                  filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "12px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.6,
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
            background:
              "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.2), transparent)",
            marginTop: "60px",
          }}
        />
      </div>
    </section>
  );
};

export default Features;
