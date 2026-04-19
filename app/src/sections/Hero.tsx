import { Link } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";
import Button from "../components/Button";
import GlassCard from "../components/ui/GlassCard";

const Hero = () => {
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
        background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      }}
    >
      <ParticleBackground />

      {/* Ambient glow - gold accent */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(245, 158, 11, 0.12) 0%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Glassmorphism overlay effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.3) 100%)",
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
        {/* USP Badge - Glassmorphism style */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            marginBottom: "32px",
            background: "rgba(245, 158, 11, 0.1)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "9999px",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "#F59E0B",
            letterSpacing: "0.5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F59E0B",
              animation: "pulse 2s infinite",
            }}
          />
          Hardcoded & Immutable
        </div>

        {/* Headline - USP */}
        <h1
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "24px",
            color: "#F8FAFC",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#F59E0B" }}>72-Hour Grace Period</span>
          <br />
          <span
            style={{
              fontWeight: 400,
              color: "rgba(248, 250, 252, 0.7)",
            }}
          >
            & 8% Fixed APR
          </span>
        </h1>

        {/* Sub-headline - AI Agents */}
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "clamp(16px, 1.5vw, 20px)",
            color: "rgba(248, 250, 252, 0.7)",
            marginBottom: "48px",
            maxWidth: "640px",
            margin: "0 auto 48px",
            lineHeight: 1.7,
          }}
        >
          Borrow with peace of mind, or deploy your{" "}
          <span style={{ color: "#F59E0B", fontWeight: 600 }}>
            Human-controlled AI Agents
          </span>
          {" "}to earn income 24/7. The fairest pawn shop on Solana.
        </p>

        {/* CTAs - User Roles with Glassmorphism */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "64px",
          }}
        >
          <Link to="/borrow">
            <Button variant="primary">Start Borrowing</Button>
          </Link>
          <Link to="/keeper">
            <Button variant="secondary">Deploy AI Keeper</Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "12px",
            color: "rgba(248, 250, 252, 0.5)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "48px",
          }}
        >
          Code is Law. Soul is Proof.
        </div>

        {/* Stats - Glassmorphism cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "40px",
          }}
        >
          <GlassCard
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(248, 250, 252, 0.5)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Total Value Locked
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "28px",
                fontWeight: 600,
                color: "#F59E0B",
              }}
            >
              $50M+
            </div>
          </GlassCard>

          <GlassCard
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(248, 250, 252, 0.5)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Grace Periods Used
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "28px",
                fontWeight: 600,
                color: "#F59E0B",
              }}
            >
              12,400+
            </div>
          </GlassCard>

          <GlassCard
            style={{
              padding: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(248, 250, 252, 0.5)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Network Uptime
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "28px",
                fontWeight: 600,
                color: "#F59E0B",
              }}
            >
              99.9%
            </div>
          </GlassCard>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;