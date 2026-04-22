import { Routes, Route } from 'react-router-dom';
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

function Dashboard() {
  return (
    <>
      <Hero />
      <FeatureCards />
      <ProtocolParams />
    </>
  );
}

function App() {
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#121a13' }}>
      <AuroraBackground />
      <Navbar />
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

export default App;