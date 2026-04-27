import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { FiHome, FiDollarSign, FiCpu, FiFileText, FiSettings, FiSearch, FiBell, FiZap, FiRefreshCw, FiArrowUpRight, FiArrowDownLeft, FiLink, FiZap as FiLightning, FiFile, FiExternalLink, FiArrowRight } from "react-icons/fi";

const HistoryPage = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [activeFilter, setActiveFilter] = useState("All");
  const [transactions, setTransactions] = useState<Array<{id: string, type: string, details: string, status: string, date: string, hash: string}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setTransactions([
        { id: "1", type: "Swap", details: "Swap 1.5 ETH → 42.3 SOL", status: "Completed", date: "2 min ago", hash: "7x123...abc" },
        { id: "2", type: "Borrow", details: "Borrow 500 USDC", status: "Active", date: "1 hour ago", hash: "8y456...def" },
        { id: "3", type: "Supply", details: "Supply 1,000 USDC", status: "Completed", date: "Yesterday", hash: "9z789...ghi" },
      ]);
      
      if (!publicKey || !connection) return;

      setLoading(true);
      try {
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 20 });
        const txs = await Promise.all(
          signatures.slice(0, 10).map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
              return {
                id: sig.signature,
                type: "Transaction",
                details: tx ? "Slot: " + tx.slot : "Unknown",
                status: sig.err ? "Failed" : "Completed",
                date: new Date((sig.blockTime || 0) * 1000).toLocaleString(),
                hash: sig.signature.slice(0, 8) + "..." + sig.signature.slice(-4),
              };
            } catch {
              return null;
            }
          })
        );
        setTransactions(txs.filter(Boolean));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [publicKey, connection]);

  const walletAddress = publicKey ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4) : "Not connected";

  const historyFilters = ["All", "Swap", "Borrow", "Supply", "Bridge", "Liquidate"];

  const getStatusColor = (status: string) => {
    if (status === "Completed") return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
    if (status === "Pending") return { bg: "rgba(251, 191, 36, 0.1)", color: "#fbbf24" };
    return { bg: "rgba(0, 240, 255, 0.1)", color: "#00f0ff" };
  };

  const getTypeIcon = (type: string) => {
    const iconStyle = { width: 24, height: 24, color: "#00f0ff" };
    if (type === "Swap") return <FiRefreshCw style={iconStyle} />;
    if (type === "Borrow") return <FiDollarSign style={iconStyle} />;
    if (type === "Supply") return <FiArrowDownLeft style={iconStyle} />;
    if (type === "Repay") return <FiArrowUpRight style={iconStyle} />;
    if (type === "Bridge") return <FiLink style={iconStyle} />;
    if (type === "Liquidate") return <FiLightning style={iconStyle} />;
    return <FiFile style={iconStyle} />;
  };

  const navItems = [
    { icon: FiHome, name: "Home" },
    { icon: FiDollarSign, name: "Assets" },
    { icon: FiCpu, name: "AI Intent" },
    { icon: FiFileText, name: "History", active: true },
    { icon: FiSettings, name: "Settings" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0e17", fontFamily: "'Manrope', sans-serif", color: "#dfe2ef" }}>
      <aside style={{ width: "240px", height: "100vh", position: "fixed", left: 0, top: 0, background: "#0a0e17", padding: "24px 0", display: "flex", flexDirection: "column", zIndex: 60 }}>
        <div style={{ padding: "0 32px", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#00f0ff", fontFamily: "'Space Grotesk', sans-serif" }}>Ginva</h1>
          <p style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "4px" }}>40,000 Years of Instinct — Liquidity Infrastructure for AI Agents</p>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {navItems.map((item) => (
            <a key={item.name} href="#" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 32px", color: item.active ? "#00f0ff" : "#94a3b8", borderLeft: item.active ? "2px solid #00f0ff" : "2px solid transparent", background: item.active ? "rgba(24, 27, 37, 0.5)" : "transparent", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none" }}>
              <item.icon size={20} />
              {item.name}
            </a>
          ))}
        </nav>

        <div style={{ padding: "0 32px", borderTop: "1px solid rgba(59, 73, 75, 0.15)", paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#181b25", borderRadius: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#31353f" }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600 }}>{walletAddress}</p>
              <p style={{ fontSize: "10px", color: "#00dbe9" }}>{connected ? "Connected" : "Mainnet"}</p>
            </div>
          </div>
        </div>
      </aside>

      <header style={{ position: "fixed", top: 0, left: "240px", right: 0, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(15, 19, 28, 0.9)", backdropFilter: "blur(20px)", zIndex: 50, boxShadow: "0 20px 40px rgba(0, 240, 255, 0.06)" }}>
        <div style={{ flex: 1, maxWidth: "600px", position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}><FiSearch size={18} /></span>
          <input type="text" placeholder="Search transactions..." style={{ width: "100%", background: "#181b25", border: "none", borderRadius: "8px", padding: "8px 16px 8px 40px", color: "#dfe2ef", fontSize: "14px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <FiBell size={20} style={{ cursor: "pointer", color: "#94a3b8" }} />
          <FiZap size={20} style={{ cursor: "pointer", color: "#94a3b8" }} />
        </div>
      </header>

      <main style={{ marginLeft: "240px", paddingTop: "96px", padding: "96px 32px 64px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <header style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Transaction History</h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>Track all your blockchain activity across GINVA protocol</p>
          </header>

          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
            {historyFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: activeFilter === filter ? "#00f0ff" : "#181b25",
                  color: activeFilter === filter ? "#002022" : "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading transactions...</div>
          )}

          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {transactions.map((tx) => {
                const statusColors = getStatusColor(tx.status);
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 24px",
                      background: "rgba(28, 31, 41, 0.6)",
                      backdropFilter: "blur(20px)",
                      borderRadius: "16px",
                      borderTop: "1px solid rgba(0, 240, 255, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0, 240, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getTypeIcon(tx.type)}
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{tx.details}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>{tx.hash}</span>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>•</span>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: statusColors.bg,
                          color: statusColors.color,
                          textTransform: "uppercase",
                        }}
                      >
                        {tx.status}
                      </span>
                      <button style={{ background: "transparent", border: "none", color: "#00f0ff", cursor: "pointer" }}><FiArrowRight size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer style={{ position: "fixed", bottom: 0, left: "240px", right: 0, height: "40px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderTop: "1px solid rgba(59, 73, 75, 0.15)", background: "#0a0e17", fontSize: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)" }} />
          <span style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Space Grotesk', sans-serif" }}>Agent Status: Online | Gas: 12 Gwei</span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Network Status", "Docs", "Support"].map((item) => (
            <a key={item} href="#" style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default HistoryPage;