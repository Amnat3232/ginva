import Button from "../components/Button";
import GlassCard from "../components/GlassCard";

const pools = [
  {
    name: "USDC Pool",
    asset: "USDC",
    apy: 15.8,
    tvl: 25000000,
    borrowers: 1250,
    color: "#10b981",
  },
  {
    name: "SOL Pool",
    asset: "SOL",
    apy: 8.2,
    tvl: 15000000,
    borrowers: 850,
    color: "#06b6d4",
  },
  {
    name: "Mixed Pool",
    asset: "MIXED",
    apy: 12.4,
    tvl: 10000000,
    borrowers: 420,
    color: "#8b5cf6",
  },
];

const LendingPools = () => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  return (
    <section
      id="lending"
      style={{
        padding: "100px 20px",
        background: "#0f172a",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
            Lending <span style={{ color: "#10b981" }}>Pools</span>
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
            Supply assets and earn competitive APY on your idle holdings
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "30px",
          }}
        >
          {pools.map((pool, index) => (
            <GlassCard key={index}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: `${pool.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: pool.color,
                  }}
                >
                  {pool.asset.slice(0, 2)}
                </div>
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: `${pool.color}20`,
                    border: `1px solid ${pool.color}40`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: pool.color,
                    }}
                  >
                    {pool.apy}%
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      color: pool.color,
                      marginLeft: "4px",
                    }}
                  >
                    APY
                  </span>
                </div>
              </div>

              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "20px",
                }}
              >
                {pool.name}
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "25px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.5)",
                      marginBottom: "4px",
                    }}
                  >
                    TVL
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {formatNumber(pool.tvl)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.5)",
                      marginBottom: "4px",
                    }}
                  >
                    Active Borrowers
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {pool.borrowers.toLocaleString()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                  marginBottom: "25px",
                }}
              >
                {["Daily", "Monthly", "Yearly"].map((period) => {
                  const earnings =
                    (pool.tvl * (pool.apy / 100)) /
                    (period === "Daily" ? 365 : period === "Monthly" ? 12 : 1);
                  return (
                    <div
                      key={period}
                      style={{
                        padding: "10px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "10px",
                          color: "rgba(255, 255, 255, 0.5)",
                          marginBottom: "4px",
                        }}
                      >
                        {period}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: pool.color,
                        }}
                      >
                        $
                        {period === "Yearly"
                          ? ((pool.tvl * pool.apy) / 100).toFixed(0)
                          : earnings.toFixed(0)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                className="w-100"
                style={{ borderColor: pool.color, color: pool.color }}
              >
                Supply {pool.asset}
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LendingPools;
