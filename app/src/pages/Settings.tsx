import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FiSend, FiCheck, FiX, FiBell, FiHome, FiDollarSign, FiCpu, FiFileText, FiSettings, FiInfo } from "react-icons/fi";

const Settings = () => {
  const { publicKey, connected } = useWallet();
  const [autoExecute, setAutoExecute] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState("medium");
  const [customRPC, setCustomRPC] = useState("");
  const [displayName, setDisplayName] = useState("NeonSentinel_01");
  
  // Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramVerified, setTelegramVerified] = useState(false);

  const walletAddress = publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : "Not connected";

  const verifyTelegram = () => {
    if (telegramChatId.trim()) {
      setTelegramVerified(true);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif" }}>
      <aside style={{ width: "240px", height: "100vh", position: "fixed", left: 0, top: 0, background: "#0a0e17", padding: "24px 0", display: "flex", flexDirection: "column", zIndex: 60 }}>
        <div style={{ padding: "0 32px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>Ginva</h1>
          <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "4px" }}>40,000 Years of Instinct — Liquidity Infrastructure for AI Agents</p>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: <FiHome size={20} />, name: "Home" },
            { icon: <FiDollarSign size={20} />, name: "Assets" },
            { icon: <FiCpu size={20} />, name: "AI Intent" },
            { icon: <FiFileText size={20} />, name: "History" },
            { icon: <FiSettings size={20} />, name: "Settings", active: true },
          ].map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 32px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none" }}>
              {item.icon}
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
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}><FiBell style={{ marginRight: "8px" }} />Telegram Notifications</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Enable Telegram Alerts</span>
                <button 
                  onClick={() => setTelegramEnabled(!telegramEnabled)} 
                  style={{ 
                    width: "48px", 
                    height: "24px", 
                    borderRadius: "12px", 
                    background: telegramEnabled ? "#00f0ff" : "#262a34", 
                    border: "none", 
                    cursor: "pointer" 
                  }}
                />
              </div>
              
              {telegramEnabled && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>Telegram Chat ID</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        value={telegramChatId} 
                        onChange={(e) => setTelegramChatId(e.target.value)} 
                        placeholder="123456789" 
                        style={{ 
                          flex: 1,
                          background: "#0a0e17", 
                          border: `1px solid ${telegramVerified ? "#10b981" : "rgba(59,73,75,0.2)"}`, 
                          borderRadius: "8px", 
                          padding: "12px", 
                          color: "#dfe2ef" 
                        }} 
                      />
                      <button 
                        onClick={verifyTelegram}
                        style={{ 
                          background: telegramVerified ? "#10b981" : "#00f0ff", 
                          border: "none", 
                          borderRadius: "8px", 
                          padding: "12px 16px", 
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {telegramVerified ? <FiCheck size={16} /> : <FiSend size={16} />}
                      </button>
                    </div>
                    {telegramVerified && (
                      <p style={{ color: "#10b981", fontSize: "12px", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FiCheck /> Connected - You will receive alerts for:
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {telegramVerified && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {[
                    "Loan Maturity (72h)",
                    "Health Factor Warning",
                    "Liquidation Alert",
                    "Deposit/Withdrawal",
                    "Keeper Rewards",
                    "System Updates"
                  ].map((alert) => (
                    <label key={alert} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: "#00f0ff" }} />
                      {alert}
                    </label>
                  ))}
                </div>
              )}
              
              <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                <FiInfo style={{ marginRight: "4px" }} /> To get your Chat ID: Start a conversation with @GinvaBot on Telegram
              </p>
            </div>
          </div>
          
          <div style={{ background: "#181b25", borderRadius: "16px", padding: "24px" }}>
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