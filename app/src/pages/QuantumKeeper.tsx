import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const QuantumKeeper = () => {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [activeRole, setActiveRole] = useState("trigger");
  const [keeperStats, setKeeperStats] = useState({ revenueShare: 4821.40, weeklyPool: 2.44, yourShare: 0.18 });

  useEffect(() => {
    if (connected && publicKey) {
      const pubkeyStr = publicKey.toBase58();
      const hash = pubkeyStr.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
      setKeeperStats({
        revenueShare: 4821.40 + (Math.abs(hash) % 1000),
        weeklyPool: 2.44 + (Math.abs(hash) % 100) / 100,
        yourShare: 0.18 + (Math.abs(hash) % 50) / 500,
      });
    }
  }, [connected, publicKey]);

  const roles = [
    { id: "trigger", name: "Trigger (Keeper A)", icon: "⚡", desc: "Monitoring network events", active: true },
    { id: "storefront", name: "Storefront (Keeper B)", icon: "🏪", desc: "Optimizing market execution", active: false },
    { id: "finalize", name: "Finalize (Keeper C)", icon: "✓", desc: "Securing block settlement", active: false },
  ];

  const terminalMessages = [
    { time: "14:22:01", type: "ai", text: "Monitoring 12 active loans across Aave and Compound..." },
    { time: "14:23:45", type: "normal", text: "Detected 4% yield increase in USDC-ETH pool..." },
    { time: "14:24:12", type: "pending", text: "Optimization strategy pending your approval." },
    { time: "14:25:30", type: "success", text: "Finalized 3 cross-chain settlements. Reward: 0.0042 ETH" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif", paddingBottom: "100px" }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "rgba(2,6,23,0.6)", backdropFilter: "blur(24px)", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px", borderBottom: "1px solid rgba(59,73,75,0.15)" }}>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>GINVA</span>
        <button 
          onClick={() => setVisible(true)}
          style={{ background: "linear-gradient(135deg, #00f0ff, #00dbe9)", border: "none", borderRadius: "8px", padding: "8px 20px", color: "#002022", fontWeight: 700, cursor: "pointer" }}
        >
          {connected ? (publicKey ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4) : "Connected") : "Connect Wallet"}
        </button>
      </header>

      <main style={{ paddingTop: "96px", paddingLeft: "32px", paddingRight: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
          <div style={{ gridColumn: "span 4" }}>
            <div style={{ background: "rgba(10,14,23,0.6)", backdropFilter: "blur(24px)", borderRadius: "16px", padding: "24px", borderLeft: "2px solid rgba(0,240,255,0.5)" }}>
              <h3 style={{ fontSize: "12px", color: "#00dbe9", textTransform: "uppercase", letterSpacing: "widest", marginBottom: "16px" }}>Keeper System Role</h3>
              {roles.map((role) => (
                <button key={role.id} onClick={() => setActiveRole(role.id)} style={{ width: "100%", textAlign: "left", padding: "12px", borderRadius: "12px", background: activeRole === role.id ? "rgba(0,240,255,0.1)" : "transparent", border: activeRole === role.id ? "1px solid rgba(0,240,255,0.3)" : "1px solid rgba(59,73,75,0.2)", marginBottom: "8px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{role.icon}</span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#dfe2ef" }}>{role.name}</p>
                      <p style={{ fontSize: "10px", color: "#64748b" }}>{role.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ background: "rgba(10,14,23,0.6)", backdropFilter: "blur(24px)", borderRadius: "16px", padding: "24px", marginTop: "24px" }}>
              <h3 style={{ fontSize: "12px", color: "#00dbe9", textTransform: "uppercase", letterSpacing: "widest", marginBottom: "16px" }}>Revenue Share</h3>
              <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk'" }}>${keeperStats.revenueShare}</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Weekly Pool</span>
                <span>{keeperStats.weeklyPool} ETH</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>Your Share</span>
                <span style={{ color: "#00f0ff" }}>{keeperStats.yourShare} ETH</span>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "span 8" }}>
            <div style={{ background: "rgba(10,14,23,0.6)", backdropFilter: "blur(24px)", borderRadius: "16px", border: "1px solid rgba(0,240,255,0.2)", height: "400px", display: "flex", flexDirection: "column" }}>
              <div style={{ background: "rgba(2,6,23,0.8)", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308" }}></div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }}></div>
                  <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "16px", fontFamily: "monospace" }}>Live Intent Stream // Quantum_Core_v4</span>
                </div>
                <span style={{ fontSize: "10px", color: "#00f0ff", animation: "pulse 2s infinite" }}>● SIGNAL ACTIVE</span>
              </div>
              <div style={{ padding: "24px", flex: 1, overflowY: "auto", fontFamily: "monospace", fontSize: "14px" }}>
                {terminalMessages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "16px" }}>
                    <span style={{ color: "#00dbe9", fontSize: "12px" }}>{msg.time}</span>
                    <p style={{ color: msg.type === "ai" ? "#00f0ff" : msg.type === "success" ? "#22d3ee" : "#dfe2ef", marginTop: "4px" }}>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuantumKeeper;