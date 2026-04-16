import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLoanAccount, useCryptoPrices } from "../services/queries";

const BorrowVault = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [activeTab, setActiveTab] = useState("active");
  const [assets, setAssets] = useState([
    { name: "Solana", symbol: "SOL", balance: "45.20", value: "$5,824", color: "#00f0ff" },
    { name: "Ethereum", symbol: "ETH", balance: "3.80", value: "$13,005", color: "#627eea" },
    { name: "Bitcoin", symbol: "BTC", balance: "0.15", value: "$9,733", color: "#f7931a" },
  ]);
  const [loans, setLoans] = useState([
    { id: "1", collateral: "SOL", amount: 45.2, borrowed: 5200, ltv: 62, health: 1.45, due: "Dec 15" },
    { id: "2", collateral: "ETH", amount: 3.8, borrowed: 8500, ltv: 58, health: 1.62, due: "Jan 20" },
    { id: "3", collateral: "BTC", amount: 0.15, borrowed: 6200, ltv: 55, health: 1.78, due: "Feb 10" },
  ]);

  const userPubkey = publicKey?.toString() || null;
  const { data: loanData, isLoading: loanLoading } = useLoanAccount(userPubkey);
  const { data: prices, isLoading: pricesLoading } = useCryptoPrices(["solana", "ethereum", "bitcoin"]);

  useEffect(() => {
    if (!connected || !publicKey || !connection) return;
    
    const fetchVaultData = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        const solBalance = lamports / 1e9;
        const solPrice = prices?.solana?.usd || 128;
        
        const updatedAssets = [
          { name: "Solana", symbol: "SOL", balance: solBalance.toFixed(2), value: `$${(solBalance * solPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}`, color: "#00f0ff" },
          { name: "Ethereum", symbol: "ETH", balance: "3.80", value: `$${((prices?.ethereum?.usd || 3420) * 3.8).toLocaleString(undefined, {maximumFractionDigits: 0})}`, color: "#627eea" },
          { name: "Bitcoin", symbol: "BTC", balance: "0.15", value: `$${((prices?.bitcoin?.usd || 64890) * 0.15).toLocaleString(undefined, {maximumFractionDigits: 0})}`, color: "#f7931a" },
        ];
        setAssets(updatedAssets);
      } catch (e) { console.error(e); }
    };
    
    fetchVaultData();
  }, [connected, publicKey, connection, prices]);

  const getHealthColor = (h: number) => h < 1.2 ? "#ef4444" : h < 1.5 ? "#eac324" : "#00f0ff";
  const getLtvColor = (l: number) => l > 60 ? "#ef4444" : l > 50 ? "#eac324" : "#00f0ff";

  return (
    <div style={{ minHeight: "100vh", background: "#0f131c", fontFamily: "'Manrope', sans-serif" }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#0f131c", borderBottom: "1px solid rgba(59,73,75,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px", zIndex: 50 }}>
        <span style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk'" }}>GINVA</span>
        <button 
          onClick={() => setVisible(true)}
          style={{ background: "linear-gradient(135deg, #00f0ff, #00dbe9)", border: "none", borderRadius: "8px", padding: "8px 20px", color: "#002022", fontWeight: 700, cursor: "pointer" }}
        >
          {connected ? (publicKey ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4) : "Connected") : "Connect Wallet"}
        </button>
      </header>

      <aside style={{ position: "fixed", left: 0, top: "64px", height: "100vh", width: "240px", background: "#0a0e17", padding: "24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 24px", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1c1f29" }}></div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700 }}>Ginva Protocol</p>
              <p style={{ fontSize: "10px", color: "#64748b" }}>Liquidity Provider</p>
            </div>
          </div>
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
        <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk'", color: "#00f0ff", marginBottom: "8px" }}>Borrow Against Collateral</h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>Leverage your crypto assets without selling. Fixed 8% APR.</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", background: "#181b25", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          {["active", "settled", "protection"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "12px 24px", background: activeTab === tab ? "linear-gradient(90deg, rgba(0,240,255,0.2), rgba(0,219,233,0.1))" : "transparent", border: "none", borderRadius: "8px", color: activeTab === tab ? "#00f0ff" : "#64748b", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", cursor: "pointer" }}>
              {tab === "protection" ? "Protection" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px" }}>
          {assets.map((asset) => (
            <div key={asset.symbol} style={{ background: "#1c1f29", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: asset.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0a0e17" }}>{asset.symbol[0]}</div>
                <div>
                  <p style={{ fontWeight: 700 }}>{asset.name}</p>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>{asset.symbol}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>Balance</p>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>{asset.balance}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>Value</p>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#00f0ff" }}>{asset.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#181b25", borderRadius: "16px", padding: "32px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Active Vaults</h3>
          {loans.map((loan) => (
            <div key={loan.id} style={{ background: "#0a0e17", borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: loan.id === "1" ? "#00f0ff" : loan.id === "2" ? "#627eea" : "#f7931a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{loan.collateral[0]}</div>
                  <div>
                    <p style={{ fontSize: "18px", fontWeight: 700 }}>{loan.collateral}</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{loan.amount} {loan.collateral}</p>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>Borrowed</p>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>${loan.borrowed.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>LTV</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "60px", height: "6px", background: "#262a34", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${loan.ltv}%`, height: "100%", background: getLtvColor(loan.ltv) }}></div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{loan.ltv}%</span>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>Health</p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: getHealthColor(loan.health) }}>{loan.health.toFixed(2)}</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ background: "#262a34", color: "#dfe2ef", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none" }}>Add Collateral</button>
                  <button style={{ background: "rgba(0,240,255,0.1)", color: "#00f0ff", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(0,240,255,0.3)" }}>Repay</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BorrowVault;