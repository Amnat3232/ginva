import Button from "../components/Button";
import GlassCard from "../components/GlassCard";

const deals = [
  {
    asset: "SOL",
    amount: 1250,
    discount: 15,
    endsIn: 3600,
    seller: "7xK9...3mNp",
  },
  {
    asset: "BTC",
    amount: 0.5,
    discount: 12,
    endsIn: 7200,
    seller: "3mNp...8qRs",
  },
  {
    asset: "ETH",
    amount: 8,
    discount: 18,
    endsIn: 1800,
    seller: "9pQr...2tUv",
  },
];

const LiquidationDeals = () => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <section
      id="liquidations"
      style={{
        padding: "100px 20px",
        background: "linear-gradient(180deg, #0f172a 0%, #0a0a0f 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
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
            Liquidation <span style={{ color: "#ef4444" }}>Deals</span>
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
            Buy seized assets at discounted prices from liquidation events
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "30px",
          }}
        >
          {deals.map((deal, index) => (
            <GlassCard key={index}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      deal.asset === "BTC"
                        ? "#f7931a20"
                        : deal.asset === "ETH"
                        ? "#627eea20"
                        : "#00ffa320",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: "12px",
                    color:
                      deal.asset === "BTC"
                        ? "#f7931a"
                        : deal.asset === "ETH"
                        ? "#627eea"
                        : "#00ffa3",
                  }}
                >
                  {deal.asset.slice(0, 2)}
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#ef4444",
                    }}
                  >
                    {deal.discount}%
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px",
                      color: "#ef4444",
                      marginLeft: "4px",
                    }}
                  >
                    OFF
                  </span>
                </div>
              </div>

              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "5px",
                }}
              >
                {deal.asset} {deal.amount}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginBottom: "20px",
                }}
              >
                Seller: {deal.seller}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "10px",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                  }}
                >
                  Ends in
                </span>
                <span
                  style={{
                    color: "#ef4444",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {formatTime(deal.endsIn)}
                </span>
              </div>

              <Button
                variant="secondary"
                className="w-100"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                Buy Now
              </Button>
            </GlassCard>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Button variant="secondary">View All Deals</Button>
        </div>
      </div>
    </section>
  );
};

export default LiquidationDeals;
