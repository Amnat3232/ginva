import { useState } from "react";
import Button from "../components/Button";
import GlassCard from "../components/ui/GlassCard";
import React from "react";

const faqs = [
  {
    question: "What makes GINVA different from other lending protocols?",
    answer: "GINVA offers a unique 72-hour grace period protection. When your collateral drops below the liquidation threshold, you get 72 hours to add more collateral or repay - no instant liquidation. You can also deploy AI Agents to automatically manage your position.",
  },
  {
    question: "How does the 72-hour grace period work?",
    answer: "If your collateral ratio falls below the threshold (typically 120%), the protocol enters a warning state. You then have exactly 72 hours to either add more collateral or repay part of your loan. Only after this grace period expires can liquidation occur.",
  },
  {
    question: "What is the interest rate?",
    answer: "8% fixed APR - this rate is hardcoded into the Pinocchio smart contract and can never be changed. No variable rates, no surprises.",
  },
  {
    question: "What happens if my collateral is liquidated?",
    answer: "Before liquidation, you receive notifications via the protocol. During the 72-hour grace period, you can add collateral or repay. Only after the grace period expires can your collateral be sold - at a discount to liquidators.",
  },
  {
    question: "Is my collateral safe?",
    answer: "GINVA is non-custodial - your assets remain in your wallet. The protocol uses your collateral as security but never takes custody. All operations are on-chain and verifiable. The code is immutable and auditable.",
  },
  {
    question: "What assets can I use as collateral?",
    answer: "Currently SOL, BTC, and ETH are supported. More assets will be added based on market liquidity and community governance.",
  },
  {
    question: "What are AI Keepers and how do they help?",
    answer: "AI Keepers are human-controlled AI agents that can automatically monitor your loan position, add collateral when needed, or execute repay transactions. They're like having a 24/7 assistant managing your loans.",
  },
  {
    question: "How do I get started?",
    answer: "Connect your wallet, deposit crypto as collateral, and borrow USDC instantly. No KYC required - just connect your wallet and start using the protocol.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        padding: "120px 20px",
        background: "linear-gradient(180deg, #0A0E17 0%, #0F172A 100%)",
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
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
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
            Frequently Asked <span style={{ color: "#F59E0B" }}>Questions</span>
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
            Everything you need to know about GINVA
          </p>
        </div>

        <div style={{ marginBottom: "48px" }}>
          {faqs.map((faq, index) => (
            <GlassCard
              key={index}
              style={{
                marginBottom: "12px",
                padding: "0",
                background: openIndex === index
                  ? "rgba(245, 158, 11, 0.06)"
                  : "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: openIndex === index
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: "100%",
                  padding: "24px 28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#F8FAFC",
                    transition: "color 0.2s ease",
                  }}
                >
                  {faq.question}
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    color: "#F59E0B",
                    transform: openIndex === index ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.3s ease",
                    fontWeight: 300,
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: openIndex === index ? "300px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                <p
                  style={{
                    padding: "0 28px 24px",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "15px",
                    color: "rgba(248, 250, 252, 0.7)",
                    lineHeight: 1.8,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard
          style={{
            textAlign: "center",
            padding: "40px",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderRadius: "20px",
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "16px",
              color: "rgba(248, 250, 252, 0.8)",
              marginBottom: "24px",
            }}
          >
            Still have questions?
          </p>
          <Button variant="secondary">Join Discord Community</Button>
        </GlassCard>
      </div>

      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.2), transparent)",
          marginTop: "80px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />

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

export default FAQ;