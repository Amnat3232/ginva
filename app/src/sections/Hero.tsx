import { useEffect } from "react";
import ParticleBackground from "../components/ParticleBackground";
import Button from "../components/Button";
import GlassCard from "../components/GlassCard";
import AnimatedCounter from "../components/AnimatedCounter";
import gsap from "gsap";

const Hero = () => {
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero-title", {
      y: 100,
      opacity: 0,
      duration: 1,
      delay: 0.2,
    })
      .from(
        ".hero-subtitle",
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
        },
        "-=0.5"
      )
      .from(
        ".hero-buttons",
        {
          y: 20,
          opacity: 0,
          duration: 0.6,
        },
        "-=0.4"
      )
      .from(
        ".hero-stats",
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
        },
        "-=0.3"
      );
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%)",
      }}
    >
      <ParticleBackground />

      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "900px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(14px, 2vw, 18px)",
            color: "#f59e0b",
            textTransform: "uppercase",
            letterSpacing: "4px",
            marginBottom: "20px",
            animation: "float 3s ease-in-out infinite",
          }}
        >
          Next Generation DeFi Protocol
        </div>

        <h1
          className="hero-title"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(40px, 8vw, 80px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "30px",
            background:
              "linear-gradient(135deg, #ffffff 0%, #f59e0b 50%, #eab308 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 60px rgba(245, 158, 11, 0.5)",
          }}
        >
          Unlock Your Crypto
          <br />
          Liquidity
        </h1>

        <p
          className="hero-subtitle"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "40px",
            maxWidth: "600px",
            margin: "0 auto 40px",
          }}
        >
          Borrow against your crypto assets with instant liquidity, competitive
          rates, and zero friction. Your assets, your liquidity.
        </p>

        <div
          className="hero-buttons"
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "60px",
          }}
        >
          <Button magnetic>Get Started</Button>
          <Button variant="outline">Documentation</Button>
        </div>

        <div
          className="hero-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "40px",
          }}
        >
          <GlassCard hoverEffect={false}>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "8px",
              }}
            >
              Total Value Locked
            </div>
            <AnimatedCounter end={50} prefix="$" suffix="M+" />
          </GlassCard>
          <GlassCard hoverEffect={false}>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "8px",
              }}
            >
              Active Loans
            </div>
            <AnimatedCounter end={10000} suffix="+" />
          </GlassCard>
          <GlassCard hoverEffect={false}>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "8px",
              }}
            >
              Uptime
            </div>
            <AnimatedCounter end={99.9} prefix="" suffix="%" decimals={1} />
          </GlassCard>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
