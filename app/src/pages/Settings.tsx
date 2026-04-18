import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const Settings = () => {
  const { publicKey, connected } = useWallet();
  const [autoExecute, setAutoExecute] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState("medium");
  const [customRPC, setCustomRPC] = useState("");
  const [displayName, setDisplayName] = useState("NeonSentinel_01");

  const walletAddress = publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : "Not connected";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif" }}>
      <aside style={{ width: "240px", height: "100vh", position: "fixed", left: 0, top: 0, background: "#0a0e17", padding: "24px 0", display: "flex", flexDirection: "column", zIndex: 60 }}>
        <div style={{ padding: "0 32px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>Ginva</h1>
          <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "4px" }}>40,000 Years of Instinct — Liquidity Infrastructure for AI Agents</p>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: "🏠", name: "Home" },
            { icon: "💰", name: "Assets" },
            { icon: "🤖", name: "AI Intent" },
            { icon: "📜", name: "History" },
            { icon: "⚙️", name: "Settings", active: true },
          ].map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 32px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none" }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: "240px", padding: "96px 32px 48px", flex: 1 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#00f0ff", marginBottom: "32px" }}>Settings</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
          <div style={{ background: "#181b25", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Account</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>Display Name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: "100%", background: "#0a0e17", border: "1px solid rgba(59,73,75,0.2)", borderRadius: "8px", padding: "12px", color: "#dfe2ef" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>Wallet Address</label>
                <p style={{ color: "#00f0ff", fontFamily: "monospace" }}>{walletAddress}</p>
              </div>
            </div>
          </div>

          <div style={{ background: "#181b25", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>AI Agent Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Auto-Execute Strategies</span>
                <button onClick={() => setAutoExecute(!autoExecute)} style={{ width: "48px", height: "24px", borderRadius: "12px", background: autoExecute ? "#00f0ff" : "#262a34", border: "none", cursor: "pointer" }}></button>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>Risk Threshold</label>
                <select value={riskThreshold} onChange={(e) => setRiskThreshold(e.target.value)} style={{ width: "100%", background: "#0a0e17", border: "1px solid rgba(59,73,75,0.2)", borderRadius: "8px", padding: "12px", color: "#dfe2ef" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "#181b25", borderRadius: "16px", padding: "24px", gridColumn: "span 2" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Network Settings</h3>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>Custom RPC URL</label>
              <input value={customRPC} onChange={(e) => setCustomRPC(e.target.value)} placeholder="https://rpc.example.com" style={{ width: "100%", background: "#0a0e17", border: "1px solid rgba(59,73,75,0.2)", borderRadius: "8px", padding: "12px", color: "#dfe2ef" }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;