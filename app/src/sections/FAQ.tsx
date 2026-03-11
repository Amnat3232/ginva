import { useState, useEffect } from "react";
import Button from "../components/Button";
import gsap from "gsap";

const faqs = [
  {
    question: "What is GINVA?",
    answer:
      "GINVA is a decentralized lending protocol built on Solana that allows users to borrow stablecoins against their crypto assets as collateral without selling them.",
  },
  {
    question: "How does borrowing work?",
    answer:
      "Deposit your crypto assets as collateral, choose your desired loan-to-value (LTV) ratio, and instantly receive liquidity in your preferred stablecoin. Repay anytime to reclaim your collateral.",
  },
  {
    question: "What is LTV?",
    answer:
      "LTV (Loan-to-Value) determines how much you can borrow against your collateral. GINVA offers 20%, 40%, and 60% LTV options. Higher LTV means more liquidity but higher liquidation risk.",
  },
  {
    question: "What happens if my collateral is liquidated?",
    answer:
      "If your collateral value drops below the liquidation threshold, your assets may be sold at a discount to repay your loan. We notify you before liquidation occurs.",
  },
  {
    question: "Is my collateral safe?",
    answer:
      "Yes, GINVA is non-custodial, meaning your assets remain in your wallet. We never take custody of your funds. All transactions are on-chain and verifiable.",
  },
  {
    question: "What assets can I use as collateral?",
    answer:
      "Currently, we support SOL, BTC, and ETH as collateral. More assets will be added based on market liquidity and community demand.",
  },
  {
    question: "How is the interest rate determined?",
    answer:
      "GINVA uses a fixed 8% APR for all loans. This rate is hardcoded into the protocol and cannot be changed by any admin or centralized entity.",
  },
  {
    question: "How do I get started?",
    answer:
      "Connect your wallet, deposit crypto as collateral, and borrow instantly. No KYC required - just connect your wallet and start using the protocol.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    gsap.fromTo(
      ".faq-item",
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".faq-list",
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section
      id="faq"
      style={{
        padding: "100px 20px",
        background: "#0a0a0f",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
            Frequently Asked <span style={{ color: "#f59e0b" }}>Questions</span>
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Everything you need to know about GINVA
          </p>
        </div>

        <div className="faq-list" style={{ marginBottom: "40px" }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-item"
              style={{
                marginBottom: "15px",
                borderRadius: "16px",
                overflow: "hidden",
                background:
                  openIndex === index
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(255, 255, 255, 0.02)",
                border:
                  openIndex === index
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                transition: "all 0.3s ease",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: "100%",
                  padding: "20px 25px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {faq.question}
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    color: "#f59e0b",
                    transform:
                      openIndex === index ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: openIndex === index ? "200px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                <p
                  style={{
                    padding: "0 25px 20px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "15px",
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "rgba(245, 158, 11, 0.05)",
            borderRadius: "20px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "20px",
            }}
          >
            Still have questions?
          </p>
          <Button variant="outline">Join Discord Community</Button>
        </div>
      </div>
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.2), transparent)",
          marginTop: "60px",
        }}
      />
    </section>
  );
};

export default FAQ;
