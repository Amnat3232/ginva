import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLoanAccount, useCryptoPrices } from "../services/queries";

interface HomeProps {
  connected: boolean;
  walletAddress: string;
}

const HomeDashboard = ({ connected, walletAddress }: HomeProps) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [timeRange, setTimeRange] = useState("1W");
  const [commandInput, setCommandInput] = useState("");
  const [balance, setBalance] = useState({ sol: 0, usdc: 0 });
  
  const userPubkey = publicKey?.toString() || null;
  const { data: loanData, isLoading: loanLoading } = useLoanAccount(userPubkey);
  const { data: prices, isLoading: pricesLoading } = useCryptoPrices(["solana", "ethereum", "bitcoin"]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connection) return;
      try {
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / 1e9;
        const solPrice = prices?.solana?.usd || 128;
        setBalance({ sol: solBalance, usdc: solBalance * solPrice });
      } catch (e) { console.error(e); }
    };
    if (connected && publicKey) fetchBalance();
  }, [publicKey, connection, connected, prices]);

  const portfolio = { 
    totalValue: balance.usdc || 28450.42, 
    change24h: 1245.30, 
    changePercent: 4.58 
  };
  
  const assets = [
    { symbol: "ETH", name: "Ethereum", balance: 2.45, price: prices?.ethereum?.usd || 3420.12, change: 2.4 },
    { symbol: "SOL", name: "Solana", balance: balance.sol || 142.8, price: prices?.solana?.usd || 128.55, change: 5.1 },
    { symbol: "BTC", name: "Bitcoin", balance: 0.12, price: prices?.bitcoin?.usd || 64890, change: -0.8 },
    { symbol: "USDC", name: "USDC", balance: 12450, price: 1.0, change: 0 },
  ];
  const insights = [
    { title: "Yield Opportunity", description: "SOL staking APY increased to 6.2%", type: "opportunity" },
    { title: "Health Factor Alert", description: "ETH vault at 1.62 - Add collateral", type: "warning" },
  ];
  const chartData = [
    { date: "Oct 1", value: 25000 },
    { date: "Oct 5", value: 26500 },
    { date: "Oct 10", value: 27200 },
    { date: "Oct 15", value: 26800 },
    { date: "Oct 20", value: 27800 },
    { date: "Oct 25", value: 28450 },
  ];

  const navItems = [
    { icon: "🏠", name: "Home", active: true, path: "/" },
    { icon: "💰", name: "Assets", path: "/assets" },
    { icon: "🤖", name: "AI Intent", path: "/ai-intent" },
    { icon: "📜", name: "History", path: "/history" },
    { icon: "⚙️", name: "Settings", path: "/settings" },
  ];

  const chartBars = [40, 55, 45, 70, 85, 65, 95, 80, 100];

  const terminalOutput = [
    "> Initializing agent analysis...",
    "> Scanning liquidity pools for arbitrage opportunities...",
    "> Found 0.2 ETH spread on Raydium/Orca.",
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0e17", fontFamily: "'Manrope', sans-serif", color: "#dfe2ef" }}>
      {/* SideNavBar */}
      <aside
        style={{
          width: "240px",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          background: "#0a0e17",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          zIndex: 60,
        }}
      >
        <div style={{ padding: "0 32px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>Ginva</h1>
          <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "4px" }}>
            Cinematic Intelligence
          </p>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 32px",
                color: item.active ? "#00f0ff" : "#94a3b8",
                borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent",
                background: item.active ? "rgba(24, 27, 37, 0.5)" : "transparent",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "'Space Grotesk', sans-serif",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>

        <div style={{ padding: "0 32px", borderTop: "1px solid rgba(59, 73, 75, 0.15)", paddingTop: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              background: "#181b25",
              borderRadius: "12px",
            }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy1zZcsTdT9o27h3KTkQHyRmLrOuX7k16q0wyA3nVoissm8L72nt4ftdJryUC7Ie7gayzNjYZEGjL83q5TyEOD9P01I6umPuef7tcyIgKEIuGMzlrkVR1QQCHDr_GgGZbMI14WSAbSYLMTh4dJQdIvlAmrxHVES1MHJuMFaNVu0ZRFJAbnqlD_kFosUOtybix55tvEY397osprDYkTyXOOF20FT3S2ifL3QEbF-4krOiDo0BDsuEARl96RX6Ss0xslX0DEd1-WjQ"
              alt="User"
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#31353f" }}
            />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600 }}>0x71C...4f2E</p>
              <p style={{ fontSize: "10px", color: "#00dbe9" }}>Mainnet</p>
            </div>
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: "240px",
          right: 0,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "rgba(15, 19, 28, 0.9)",
          backdropFilter: "blur(20px)",
          zIndex: 50,
          boxShadow: "0 20px 40px rgba(0, 240, 255, 0.06)",
        }}
      >
        <div style={{ flex: 1, maxWidth: "600px", position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>🔍</span>
          <input
            type="text"
            placeholder="Search assets, intents or agents..."
            style={{
              width: "100%",
              background: "#181b25",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px 8px 40px",
              color: "#dfe2ef",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", gap: "16px", color: "#94a3b8" }}>
            <button style={{ background: "transparent", border: "none", cursor: "pointer" }}>🔔</button>
            <button style={{ background: "transparent", border: "none", cursor: "pointer" }}>✨</button>
          </div>
<button
              onClick={() => setVisible(true)}
              style={{
                background: "linear-gradient(135deg, #00f0ff, #00dbe9)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 20px",
                color: "#002022",
                fontWeight: 700,
                fontSize: "11px",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {connected && publicKey ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4) : "Connect Wallet"}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ marginLeft: "240px", paddingTop: "96px", paddingBottom: "64px", padding: "96px 32px 64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
          {/* Section 1: Portfolio Value */}
          <section
            style={{
              gridColumn: "span 8",
              background: "rgba(28, 31, 41, 0.6)",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "32px",
              borderTop: "1px solid rgba(0, 240, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "256px",
                height: "256px",
                background: "rgba(0, 240, 255, 0.05)",
                borderRadius: "50%",
                filter: "blur(80px)",
                marginTop: "-128px",
                marginRight: "-128px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", position: "relative", zIndex: 10 }}>
              <div>
                <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
                  Total Portfolio Value
                </p>
                <p style={{ fontSize: "48px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>$42,890.12</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <span style={{ display: "flex", alignItems: "center", fontSize: "12px", fontWeight: 700, color: "#00dbe9" }}>
                    ↑ +12.4%
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>vs last week</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["1D", "1W", "1M"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeRange(period)}
                    style={{
                      padding: "4px 12px",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: "6px",
                      background: timeRange === period ? "#00f0ff" : "#262a34",
                      color: timeRange === period ? "#002022" : "#94a3b8",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "192px", marginTop: "auto" }}>
              {chartBars.map((height, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: "linear-gradient(to top, rgba(0, 240, 255, 0.2), transparent)",
                    borderRadius: "4px",
                    height: `${height}%`,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Smart Insights */}
          <section
            style={{
              gridColumn: "span 4",
              background: "rgba(28, 31, 41, 0.6)",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "24px",
              borderTop: "1px solid rgba(0, 240, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>⚡</span>
                <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.15em" }}>Smart Insights</p>
              </div>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: "rgba(0, 240, 255, 0.1)",
                  fontSize: "10px",
                  color: "#00f0ff",
                  fontWeight: 700,
                }}
              >
                Active AI
              </span>
            </div>

            <div
              style={{
                background: "rgba(24, 27, 37, 0.5)",
                borderRadius: "12px",
                padding: "16px",
                borderLeft: "2px solid #00f0ff",
                marginBottom: "16px",
              }}
            >
              <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: "#00dbe9" }}>Alert:</span> Your portfolio allocation is currently 82% SOL-based. I recommend rebalancing to USDC to reduce volatility before the weekly close.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(38, 42, 52, 0.3)", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", color: "#b9cacb" }}>Potential Saving</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#00dbe9" }}>$124.50 (Gas)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(38, 42, 52, 0.3)", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", color: "#b9cacb" }}>Risk Score</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#eac324" }}>Moderate</span>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "12px",
                background: "#31353f",
                color: "#00f0ff",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Execute Rebalance 🚀
            </button>
          </section>

          {/* Section 3: Gas Card */}
          <div
            style={{
              gridColumn: "span 3",
              background: "#181b25",
              borderRadius: "16px",
              padding: "20px",
              borderTop: "1px solid rgba(0, 240, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "18px" }}>⛽</span>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.1)",
                  fontSize: "10px",
                  color: "#10b981",
                  fontWeight: 700,
                }}
              >
                Optimal
              </span>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                Network Gas
              </p>
              <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                12 <span style={{ fontSize: "12px", color: "#64748b" }}>Gwei</span>
              </p>
            </div>
          </div>

          {/* Section 4: Rewards Card */}
          <div
            style={{
              gridColumn: "span 3",
              background: "#181b25",
              borderRadius: "16px",
              padding: "20px",
              borderTop: "1px solid rgba(0, 240, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "18px" }}>🎁</span>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: "rgba(234, 195, 36, 0.1)",
                  fontSize: "10px",
                  color: "#eac324",
                  fontWeight: 700,
                }}
              >
                Claimable
              </span>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                Unclaimed Rewards
              </p>
              <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>$142.50</p>
            </div>
          </div>

          {/* Section 5: Asset List Table */}
          <section
            style={{
              gridColumn: "span 6",
              background: "rgba(28, 31, 41, 0.6)",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(59, 73, 75, 0.1)" }}>
              <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.15em" }}>Asset List</p>
              <button style={{ fontSize: "11px", color: "#00f0ff", fontWeight: 700, background: "transparent", border: "none", cursor: "pointer" }}>
                View All
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(49, 53, 63, 0.2)" }}>
                    <th style={{ padding: "12px 24px", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Asset</th>
                    <th style={{ padding: "12px 24px", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Balance</th>
                    <th style={{ padding: "12px 24px", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Price</th>
                    <th style={{ padding: "12px 24px", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid rgba(59, 73, 75, 0.05)" }}
                    >
                      <td style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            background: "#262a34",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {asset.symbol}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{asset.name}</span>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", fontFamily: "'Space Grotesk', sans-serif" }}>{asset.balance}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "#94a3b8" }}>{asset.price}</td>
                      <td
                        style={{
                          padding: "16px 24px",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: asset.positive ? "#10b981" : "#ef4444",
                        }}
                      >
                        {asset.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Command Center */}
          <section
            style={{
              gridColumn: "span 6",
              background: "rgba(28, 31, 41, 0.6)",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "24px",
              borderTop: "1px solid rgba(0, 240, 255, 0.1)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "absolute", top: "16px", right: "16px", opacity: 0.1 }}>
              <span style={{ fontSize: "60px", color: "#00dbe9" }}>⌨️</span>
            </div>
            <p style={{ fontSize: "10px", color: "#b9cacb", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>
              Command Center
            </p>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                borderRadius: "8px",
                padding: "16px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#00f0ff",
                marginBottom: "16px",
                border: "1px solid rgba(59, 73, 75, 0.2)",
              }}
            >
              {terminalOutput.map((line, i) => (
                <div key={i} style={{ marginBottom: "4px" }}>
                  <span style={{ color: "#94a3b8", opacity: 0.5, marginRight: "8px" }}>&gt;</span>
                  {line.startsWith("Found") ? (
                    <span style={{ color: "#eac324" }}>{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}
              <div style={{ animation: "pulse 1s infinite" }}>
                <span style={{ color: "#00f0ff" }}>_</span>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Type a command (e.g., 'Swap 1 ETH to SOL')..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(38, 42, 52, 0.6)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#dfe2ef",
                  fontSize: "14px",
                }}
              />
              <button
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "8px",
                  color: "#00f0ff",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ➤
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: "240px",
          right: 0,
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderTop: "1px solid rgba(59, 73, 75, 0.15)",
          background: "#0a0e17",
          fontSize: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
            }}
          />
          <span style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Space Grotesk', sans-serif" }}>
            Agent Status: Online | Gas: 12 Gwei
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Network Status", "Docs", "Support"].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {item}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default HomeDashboard;