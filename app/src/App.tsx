import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { lazy, Suspense, useState, useMemo, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Navbar from "./components/Navbar";
import Loading from "./components/ui/Loading";
import Ticker from "./components/Ticker";
import { Toast, Page } from "./types";

// New pages from our redesign
const LandingNew = lazy(() => import("./pages/LandingNew"));
const BorrowNew = lazy(() => import("./pages/BorrowNew"));
const SupportPage = lazy(() => import("./pages/Support"));
const KeeperPage = lazy(() => import("./pages/Keeper"));

// Existing pages
const Earn = lazy(() => import("./pages/Earn"));
const Pawn = lazy(() => import("./pages/Pawn"));
const Redeem = lazy(() => import("./pages/Redeem"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Storefront = lazy(() => import("./pages/Storefront"));
const Agent = lazy(() => import("./pages/Agent"));
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  const [page, setPage] = useState<Page>("landing");
  const [toast, setToast] = useState<Toast>({ msg: "", show: false });
  const [balance, setBalance] = useState<{ sol: string; usd: string } | null>(null);

  // Real wallet integration
  const { connection } = useConnection();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  // Format wallet address for display
  const walletAddress = useMemo(() => {
    if (!publicKey) return "";
    const str = publicKey.toBase58();
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  }, [publicKey]);

  // Fetch wallet balance
  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        const sol = lamports / 1e9;
        // TODO: Fetch real SOL/USD price from oracle
        const solPrice = 182;
        const usd = sol * solPrice;
        setBalance({
          sol: sol.toFixed(2),
          usd: Math.round(usd).toLocaleString(),
        });
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t: Toast) => ({ ...t, show: false })), 3000);
  };

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
      <Navbar
        page={page}
        connected={connected}
        walletAddress={walletAddress}
        balance={balance}
        onNavigate={setPage}
        onConnect={connected ? handleDisconnect : handleConnect}
      />
      <Ticker />
      <Container fluid>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingNew onNavigate={setPage} />} />
            <Route
              path="/borrow"
              element={
                <BorrowNew showToast={showToast} connected={connected} />
              }
            />
            <Route path="/keeper" element={<KeeperPage />} />
            <Route
              path="/support"
              element={<SupportPage showToast={showToast} />}
            />
            <Route path="/earn" element={<Earn />} />
            <Route path="/pawn" element={<Pawn />} />
            <Route path="/redeem" element={<Redeem />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/storefront" element={<Storefront />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Container>
      {/* Toast notification */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 999,
          background: "var(--surface2, #09160a)",
          border: "1px solid var(--green, #00e676)",
          borderRadius: 10,
          padding: "14px 20px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "var(--green, #00e676)",
          transform: toast.show ? "translateY(0)" : "translateY(80px)",
          opacity: toast.show ? 1 : 0,
          transition: "all 0.3s",
        }}
      >
        {toast.msg}
      </div>
    </div>
  );
}

export default App;
