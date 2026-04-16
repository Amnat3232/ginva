import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useSystemConfig } from "../services/queries";

const LiquidityProvider = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [depositAmount, setDepositAmount] = useState("");
  const [balance, setBalance] = useState(0);

  const { data: systemConfig } = useSystemConfig();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connection) return;
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / 1e9);
      } catch (e) { console.error(e); }
    };
    if (connected) fetchBalance();
  }, [connected, publicKey, connection]);

  const globalStats = { 
    totalLiquidity: systemConfig?.account?.totalCollateral || 142895204.42, 
    globalApr: 8.0, 
    utilization: 84.2 
  };
  const positions = [
    { id: "1", principal: 25000, timeActive: 268, currentFee: 5.0, progress: 73, isActive: true },
    { id: "2", principal: 10000, timeActive: 444, currentFee: 0.0, progress: 100, isActive: false },
  ];
  const yieldProjection = { expectedInterest: 228.40, totalGain: 240.55 };

  return (
    <div style={{ minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif" }}>
      <aside style={{ width: "240px", height: "100vh", position: "fixed", left: 0, top: 0, background: "#0a0e17", padding: "24px 0", display: "flex", flexDirection: "column", zIndex: 60 }}>
        <div style={{ padding: "0 24px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>Ginva</h1>
          <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em" }}>Cinematic Intelligence</p>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: "📊", name: "Dashboard" },
            { icon: "🏦", name: "Lending", active: true },
            { icon: "💧", name: "Liquidity" },
            { icon: "📈", name: "Portfolio" },
          ].map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", fontSize: "12px", textTransform: "uppercase", letterSpacing: "widest", textDecoration: "none" }}>
              <span>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: "240px", padding: "96px 32px 48px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#00f0ff", marginBottom: "8px" }}>Liquidity Provision</h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>Deploy stable capital into the Ginva Quantum Vault and earn fixed yield.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
          <div style={{ gridColumn: "span 8", background: "#181b25", borderRadius: "16px", padding: "32px" }}>
            <h2 style={{ fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "widest", marginBottom: "24px" }}>Platform Liquidity</h2>
            <p style={{ fontSize: "48px", fontWeight: 700, color: "#00f0ff" }}>${globalStats.totalLiquidity.toLocaleString()}</p>
            <div style={{ display: "flex", gap: "48px", marginTop: "24px" }}>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Global Fixed APR</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#00f0ff" }}>{globalStats.globalApr}%</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Utilisation</p>
                <p style={{ fontSize: "28px", fontWeight: 700 }}>{globalStats.utilization}%</p>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "span 4", background: "#1c1f29", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Deposit USDC</h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Earn predictable 8% APR</p>
            <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", background: "#0a0e17", border: "1px solid rgba(59,73,75,0.2)", borderRadius: "12px", padding: "16px", color: "#dfe2ef", fontSize: "24px" }} />
            <button style={{ width: "100%", marginTop: "16px", padding: "16px", background: "linear-gradient(90deg, #00f0ff, #00dbe9)", border: "none", borderRadius: "12px", color: "#002022", fontWeight: 700, cursor: "pointer" }}>Confirm Deposit</button>
          </div>

          <div style={{ gridColumn: "span 8", background: "#1c1f29", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Your Position</h3>
            {positions.map((pos) => (
              <div key={pos.id} style={{ background: "#0a0e17", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 700 }}>${pos.principal.toLocaleString()} USDC</span>
                  <span style={{ color: pos.currentFee > 0 ? "#eac324" : "#00f0ff" }}>{pos.currentFee}% Fee</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "#262a34", borderRadius: "2px" }}>
                  <div style={{ width: `${pos.progress}%`, height: "100%", background: "#00f0ff" }}></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ gridColumn: "span 4", background: "#181b25", borderRadius: "16px", padding: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>30-Day Projection</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Expected Interest</span>
                <span style={{ color: "#00f0ff" }}>+${yieldProjection.expectedInterest}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(59,73,75,0.1)", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>Total Gain</span>
                <span style={{ fontSize: "18px", fontWeight: 700 }}>${yieldProjection.totalGain}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiquidityProvider;