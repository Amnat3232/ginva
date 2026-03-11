import { useState, useEffect } from "react";
import Button from "../components/Button";
import gsap from "gsap";

const steps = [
  {
    number: "01",
    title: "Deposit",
    description:
      "Connect your wallet and deposit your crypto assets as collateral.",
  },
  {
    number: "02",
    title: "Receive",
    description:
      "Instantly receive liquidity in your preferred stablecoin or token.",
  },
  {
    number: "03",
    title: "Repay",
    description: "Repay your loan anytime to reclaim your collateral in full.",
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

  useEffect(() => {
    gsap.fromTo(
      ".step-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".steps-grid",
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section
      id="how-it-works"
      style={{
        padding: "100px 20px",
        background: "#0a0a0f",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
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
            How It <span style={{ color: "#f59e0b" }}>Works</span>
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.6)",
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
              width: "80%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              zIndex: 0,
            }}
          />

          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "30px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className="step-card"
                style={{
                  textAlign: "center",
                  padding: "30px",
                  background:
                    activeStep === index
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(255, 255, 255, 0.02)",
                  borderRadius: "20px",
                  border:
                    activeStep === index
                      ? "1px solid #f59e0b"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.5s ease",
                  transform: activeStep === index ? "scale(1.05)" : "scale(1)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "48px",
                    fontWeight: 700,
                    color:
                      activeStep === index
                        ? "#f59e0b"
                        : "rgba(255, 255, 255, 0.2)",
                    marginBottom: "20px",
                    transition: "color 0.5s ease",
                  }}
                >
                  {step.number}
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
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Button magnetic>Start Borrowing Now</Button>
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

export default HowItWorks;
