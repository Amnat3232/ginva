import { useState, useEffect } from "react";
import Button from "../components/Button";
import GlassCard from "../components/ui/GlassCard";
import React from "react";

const steps = [
  {
    number: "01",
    title: "Deposit Collateral",
    description:
      "Connect your wallet and deposit crypto assets as collateral. We support SOL, BTC, ETH, and more.",
  },
  {
    number: "02",
    title: "Receive USDC",
    description:
      "Instantly receive up to 60% of your collateral value in USDC. No credit check, no paperwork.",
  },
  {
    number: "03",
    title: "Grace Period Protection",
    description:
      "If your collateral drops below threshold, you get 72 hours to add more funds or repay. No instant liquidation.",
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      style={{
        padding: "120px 20px",
        background: "#0A0E17",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
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
            How <span style={{ color: "#F59E0B" }}>GINVA</span> Works
          </h2>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "18px",
              color: "rgba(248, 250, 252, 0.6)",
              maxWidth: "500px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Get liquidity in three simple steps
          </p>
        </div>

        <div
          style={{
            position: "relative",
            padding: "40px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "70%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent)",
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {steps.map((step, index) => (
              <GlassCard
                key={index}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: activeStep === index
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: activeStep === index
                    ? "1px solid rgba(245, 158, 11, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "20px",
                  transition: "all 0.4s ease",
                  transform: activeStep === index ? "scale(1.03)" : "scale(1)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "42px",
                    fontWeight: 700,
                    color: activeStep === index ? "#F59E0B" : "rgba(248, 250, 252, 0.15)",
                    marginBottom: "24px",
                    letterSpacing: "0.05em",
                    transition: "color 0.4s ease",
                  }}
                >
                  {step.number}
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
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "14px",
                    color: "rgba(248, 250, 252, 0.6)",
                    lineHeight: 1.7,
                  }}
                >
                  {step.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <Button variant="primary">Start Borrowing Now</Button>
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

export default HowItWorks;