import { useState, useEffect } from "react";
import Button from "../components/Button";
import GlassCard from "../components/GlassCard";

const assets = ["SOL", "BTC", "ETH"];
const ltvOptions = [20, 40, 60];
const durations = [30, 60, 90];

const Borrow = () => {
  const [selectedAsset, setSelectedAsset] = useState("SOL");
  const [collateral, setCollateral] = useState(1000);
  const [ltv, setLtv] = useState(40);
  const [duration, setDuration] = useState(30);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [interest, setInterest] = useState(0);

  useEffect(() => {
    const borrowed = collateral * (ltv / 100);
    setBorrowAmount(borrowed);

    const apr = 0.08;
    const dailyRate = apr / 365;
    const interestAmount = borrowed * dailyRate * duration;
    setInterest(interestAmount);
  }, [collateral, ltv, duration]);

  return (
    <section
      id="borrow"
      style={{
        padding: "100px 20px",
        background: "linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h2
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "white",
              marginBottom: "20px",
            }}
          >
            Borrow <span style={{ color: "#fbbf24" }}>Liquidity</span>
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Calculate your loan terms instantly
          </p>
        </div>

        <GlassCard>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "40px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Select Asset
              </label>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "30px" }}
              >
                {assets.map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border:
                        selectedAsset === asset
                          ? "2px solid #00e676"
                          : "1px solid rgba(255, 255, 255, 0.2)",
                      background:
                        selectedAsset === asset
                          ? "rgba(0, 230, 118, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: selectedAsset === asset ? "#00e676" : "white",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {asset}
                  </button>
                ))}
              </div>

              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Collateral Amount (USD)
              </label>
              <input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "white",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "30px",
                  outline: "none",
                }}
              />

              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                LTV (Loan-to-Value)
              </label>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "30px" }}
              >
                {ltvOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setLtv(option)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        ltv === option
                          ? "2px solid #00e676"
                          : "1px solid rgba(255, 255, 255, 0.2)",
                      background:
                        ltv === option
                          ? "rgba(0, 230, 118, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: ltv === option ? "#00e676" : "white",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {option}%
                  </button>
                ))}
              </div>

              <label
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Duration (Days)
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {durations.map((days) => (
                  <button
                    key={days}
                    onClick={() => setDuration(days)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        duration === days
                          ? "2px solid #00e676"
                          : "1px solid rgba(255, 255, 255, 0.2)",
                      background:
                        duration === days
                          ? "rgba(0, 230, 118, 0.1)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: duration === days ? "#00e676" : "white",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "30px",
                  background: "rgba(245, 158, 11, 0.1)",
                  borderRadius: "16px",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginBottom: "8px",
                  }}
                >
                  You Will Receive
                </div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#00e676",
                  }}
                >
                  ${borrowAmount.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    Interest Rate (APR)
                  </span>
                  <span
                    style={{
                      color: "white",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    8%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    Estimated Interest
                  </span>
                  <span
                    style={{
                      color: "white",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    ${interest.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    Total to Repay
                  </span>
                  <span
                    style={{
                      color: "#10b981",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    ${(borrowAmount + interest).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button magnetic className="w-100">
                Create Loan
              </Button>
            </div>
          </div>
        </GlassCard>
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

export default Borrow;
