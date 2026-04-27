import { Routes, Route } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import AuroraBackground from './components/AuroraBackground';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './pages/Hero';
import FeatureCards from './pages/FeatureCards';
import ProtocolParams from './pages/ProtocolParams';
import BorrowPage from './pages/BorrowPage';
import EarnPage from './pages/EarnPage';
import PawnShopPage from './pages/PawnShopPage';
import KeeperPage from './pages/KeeperPage';
import AIAgentPage from './pages/AIAgentPage';
import '@solana/wallet-adapter-react-ui/styles.css';

function Dashboard() {
  return (
    <>
      <Hero />
      <FeatureCards />
      <ProtocolParams />
    </>
  );
}

function AppContent() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<{ sol: string; usd: string } | null>(null);

  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      const connection = new Connection('https://api.devnet.solana.com');
      connection.getBalance(publicKey).then((lamports) => {
        const sol = (lamports / LAMPORTS_PER_SOL).toFixed(2);
        setBalance({ sol, usd: (parseFloat(sol) * 100).toFixed(2) }); // Approximate $100/SOL
      });
    } else {
      setBalance(null);
    }
  }, [connected, publicKey]);

  return (
    <div className="relative min-h-screen bg-60-peace">
      <AuroraBackground />
      <Navbar
        connected={connected}
        walletAddress={publicKey?.toBase58().slice(0, 6) + '...' + publicKey?.toBase58().slice(-4)}
        balance={balance}
      />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/borrow" element={<BorrowPage />} />
          <Route path="/earn" element={<EarnPage />} />
          <Route path="/pawn-shop" element={<PawnShopPage />} />
          <Route path="/keeper" element={<KeeperPage />} />
          <Route path="/ai-agent" element={<AIAgentPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;