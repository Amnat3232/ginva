import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useLoanAccount, useCryptoPrices } from "../services/queries";

const AIIntent = ({ connected, walletAddress }: { connected: boolean; walletAddress: string }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [commandInput, setCommandInput] = useState("");
  const [messages, setMessages] = useState([
    { type: "ai", text: "I'm monitoring 12 active loans. Your health factors are all above 1.5. Would you like me to optimize your yield strategies?" },
    { type: "user", text: "Show me my current positions" },
    { type: "ai", text: "You have 3 active positions: 45.2 SOL ($5,824), 3.8 ETH ($12,996), 0.15 BTC ($9,733). Total value: $28,453" },
  ]);
  const [portfolio, setPortfolio] = useState<any>(null);

  const userPubkey = publicKey?.toString() || null;
  const { data: loanData } = useLoanAccount(userPubkey);
  const { data: prices } = useCryptoPrices(["solana", "ethereum", "bitcoin"]);

  useEffect(() => {
    if (!connected || !publicKey || !connection) return;
    
    const fetchPortfolio = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / 1e9;
        const solPrice = prices?.solana?.usd || 128;
        
        setPortfolio({
          sol: solBalance,
          solValue: solBalance * solPrice,
          eth: 3.8,
          ethValue: (prices?.ethereum?.usd || 3420) * 3.8,
          btc: 0.15,
          btcValue: (prices?.bitcoin?.usd || 64890) * 0.15,
          totalValue: solBalance * solPrice + (prices?.ethereum?.usd || 3420) * 3.8 + (prices?.bitcoin?.usd || 64890) * 0.15
        });
        
        setMessages([
          { type: "ai", text: `Hello! I've loaded your portfolio. Total value: $${((solBalance * solPrice) + ((prices?.ethereum?.usd || 3420) * 3.8) + ((prices?.bitcoin?.usd || 64890) * 0.15)).toLocaleString(undefined, {maximumFractionDigits: 0})}. How can I help you optimize?` },
        ]);
      } catch (e) { console.error(e); }
    };
    
    fetchPortfolio();
  }, [connected, publicKey, connection, prices]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    setMessages([...messages, { type: "user", text: commandInput }]);
    setCommandInput("");
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
            { icon: "🏠", name: "Home" },
            { icon: "💰", name: "Assets" },
            { icon: "🤖", name: "AI Intent", active: true },
            { icon: "📜", name: "History" },
            { icon: "⚙️", name: "Settings" },
          ].map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 32px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none" }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: "240px", padding: "96px 32px 48px", flex: 1 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "#00f0ff", marginBottom: "24px" }}>AI Intent Terminal</h1>
        
        <div style={{ background: "#181b25", borderRadius: "16px", height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(59,73,75,0.15)", flex: 1, overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: msg.type === "ai" ? "#00f0ff" : "#262a34", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  {msg.type === "ai" ? "✨" : "👤"}
                </div>
                <div style={{ flex: 1, padding: "12px 16px", background: msg.type === "ai" ? "rgba(0,240,255,0.1)" : "#0a0e17", borderRadius: "12px" }}>
                  <p style={{ color: msg.type === "ai" ? "#00f0ff" : "#dfe2ef" }}>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} style={{ padding: "24px", borderTop: "1px solid rgba(59,73,75,0.15)", display: "flex", gap: "12px" }}>
            <input value={commandInput} onChange={(e) => setCommandInput(e.target.value)} placeholder="Enter your intent..." style={{ flex: 1, background: "#0a0e17", border: "1px solid rgba(59,73,75,0.2)", borderRadius: "12px", padding: "16px", color: "#dfe2ef" }} />
            <button type="submit" style={{ background: "linear-gradient(135deg, #00f0ff, #00dbe9)", border: "none", borderRadius: "12px", padding: "16px 24px", color: "#002022", fontWeight: 700, cursor: "pointer" }}>Send</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AIIntent;