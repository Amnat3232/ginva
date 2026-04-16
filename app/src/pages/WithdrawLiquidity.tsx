import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSystemConfig } from "../services/queries";

const WithdrawLiquidity = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [amount, setAmount] = useState("10000");
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
  
  const shieldFee = parseFloat(amount) * 0.05;
  const received = parseFloat(amount) - shieldFee;

  return (
    <div style={{ minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif" }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#0f131c", borderBottom: "1px solid rgba(59,73,75,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px", zIndex: 50 }}>
        <span style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk'" }}>GINVA</span>
        <div style={{ display: "flex", gap: "32px" }}>
          {["Lend", "Borrow", "Stats"].map((item) => (
            <a key={item} href="#" style={{ color: item === "Borrow" ? "#00f0ff" : "#94a3b8", textDecoration: "none", borderBottom: item === "Borrow" ? "2px solid #00f0ff" : "none", paddingBottom: "4px" }}>{item}</a>
          ))}
        </div>
        <button 
          onClick={() => setVisible(true)}
          style={{ background: "linear-gradient(90deg, #00f0ff, #00dbe9)", border: "none", borderRadius: "8px", padding: "8px 20px", color: "#002022", fontWeight: 700, cursor: "pointer" }}
        >
          {connected ? (publicKey ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4) : "Connected") : "Connect Wallet"}
        </button>
      </header>

      <aside style={{ position: "fixed", left: 0, top: "64px", height: "100vh", width: "240px", background: "#0a0e17", padding: "80px 24px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#00f0ff" }}>Neon Observatory</div>
          <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "widest", textTransform: "uppercase" }}>Protocol Active</div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: "📊", name: "Dashboard" },
            { icon: "🏦", name: "Markets", active: true },
            { icon: "📈", name: "Portfolio" },
            { icon: "📜", name: "History" },
          ].map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 16px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", background: item.active ? "linear-gradient(90deg, rgba(0,240,255,0.1), transparent)" : "transparent", fontSize: "14px", textDecoration: "none" }}>
              <span>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: "240px", padding: "96px 32px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#00f0ff" }}>Withdraw Liquidity</h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>Exit your lending position and retrieve USDC assets.</p>
          </div>
          <div style={{ background: "#1c1f29", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,240,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>🏦</div>
            <div>
              <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Supplied Balance</p>
              <p style={{ fontSize: "18px", fontWeight: 700 }}>42,500.00 USDC</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
          <div style={{ gridColumn: "span 7", background: "#181b25", borderRadius: "16px", padding: "32px" }}>
            <h2 style={{ fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "widest", marginBottom: "24px" }}>Execution</h2>
            
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <label style={{ fontSize: "14px" }}>Enter Amount</label>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Available: 42,500 USDC</span>
              </div>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", background: "#0a0e17", border: "none", borderRadius: "16px", padding: "20px 24px", fontSize: "24px", color: "#dfe2ef" }} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => setAmount((42500 * p / 100).toString())} style={{ flex: 1, padding: "8px", borderRadius: "12px", background: "#0a0e17", border: "1px solid rgba(59,73,75,0.15)", color: "#64748b", cursor: "pointer" }}>{p}%</button>
              ))}
            </div>

            <div style={{ background: "#0a0e17", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#64748b" }}>Withdrawal Amount</span>
                <span>{parseFloat(amount).toFixed(2)} USDC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#eac324" }}>Shield Fee (5%)</span>
                <span style={{ color: "#eac324" }}>- {shieldFee.toFixed(2)} USDC</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(59,73,75,0.1)", paddingTop: "16px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>Estimated Received</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#00f0ff" }}>{received.toFixed(2)} USDC</span>
              </div>
            </div>

            <button style={{ width: "100%", padding: "20px", background: "linear-gradient(135deg, #eac324, #eac324)", color: "#231b00", borderRadius: "16px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              🔓 Confirm Withdrawal
            </button>
          </div>

          <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "rgba(234,195,36,0.05)", borderLeft: "4px solid #eac324", borderRadius: "0 16px 16px 0", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#eac324", marginBottom: "16px" }}>
                <span>⚠️</span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, textTransform: "uppercase" }}>Shield Fee Warning</h3>
              </div>
              <p style={{ color: "#dfe2ef", fontSize: "14px", marginBottom: "16px" }}>
                This withdrawal is within 15 days. A 5% stability fee is active.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Time Until 0% Fee</span>
                <span style={{ color: "#00f0ff", fontWeight: 700 }}>08d 14h 22m</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "#262a34", borderRadius: "2px", marginTop: "8px" }}>
                <div style={{ width: "45%", height: "100%", background: "#00f0ff" }}></div>
              </div>
            </div>

            <div style={{ background: "#181b25", borderRadius: "16px", padding: "24px" }}>
              <h4 style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "widest", marginBottom: "16px" }}>Network Context</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "4px", background: "#00f0ff", borderRadius: "2px" }}></div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>Total Liquidity Locked</p>
                    <p style={{ fontWeight: 700 }}>$1.24B</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "4px", background: "#64748b", borderRadius: "2px" }}></div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>Active Stakers</p>
                    <p style={{ fontWeight: 700 }}>142,891</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WithdrawLiquidity;