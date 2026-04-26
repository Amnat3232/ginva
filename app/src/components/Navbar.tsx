// Navbar Component
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FiHome, FiDollarSign, FiZap, FiUser, FiSettings, FiHelpCircle, FiClock, FiMoreHorizontal, FiChevronDown, FiArrowLeft } from "react-icons/fi";
import NetworkSwitcher from "./NetworkSwitcher";

interface NavbarProps {
  connected?: boolean;
  walletAddress?: string;
  balance?: { sol: string; usd: string } | null;
  onConnect?: () => void;
}

const BACK_PAGES = ["/borrow", "/earn", "/keeper", "/settings", "/support", "/history", "/dashboard", "/home2026", "/ai-intent", "/quantum", "/liquidity", "/borrow-vault", "/withdraw", "/redeem", "/storefront", "/agent", "/admin", "/my-tickets"];

export function Navbar({
  connected,
  walletAddress,
  balance,
  onConnect,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isBackPage = BACK_PAGES.some(p => location.pathname.startsWith(p));
  const isLanding = location.pathname === "/" || location.pathname === "/landing";

  const navItems = [
    { label: "Portfolio", icon: <FiHome size={18} />, path: "/dashboard" },
    { label: "Borrow", icon: <FiDollarSign size={18} />, path: "/borrow" },
    { label: "Earn", icon: <FiZap size={18} />, path: "/earn" },
    { label: "Keeper", icon: <FiUser size={18} />, path: "/keeper" },
  ];

  const moreItems = [
    { label: "History", icon: <FiClock size={16} />, path: "/history" },
    { label: "Settings", icon: <FiSettings size={16} />, path: "/settings" },
    { label: "Support", icon: <FiHelpCircle size={16} />, path: "/support" },
  ];

  return (
    <nav
      className="navbar"
      style={{
        background: scrolled ? "rgba(15, 23, 42, 0.95)" : "rgba(15, 23, 42, 0.85)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
        height: scrolled ? "56px" : "64px",
        transition: "all 0.2s ease",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="navbar-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "0 24px", height: "100%" }}>
        
        {/* Left side - Back button or Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isBackPage && !isLanding && (
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "rgba(248, 250, 252, 0.1)",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                color: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Go back"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
          
          <div 
            className="logo" 
            onClick={() => navigate("/")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div 
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#F59E0B",
                boxShadow: "0 0 10px #F59E0B",
              }} 
            />
            <span style={{ color: "#F8FAFC", fontWeight: 600, fontSize: "1.1rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>GINVA</span>
          </div>
        </div>

        {/* Center - Nav Links (Desktop) */}
        <div className="nav-links" style={{ display: "flex", gap: "4px" }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${isActive(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: isActive(item.path) ? "rgba(245, 158, 11, 0.15)" : "transparent",
                color: isActive(item.path) ? "#F59E0B" : "rgba(248, 250, 252, 0.7)",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          
          {/* More Menu */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={() => setShowMore(!showMore)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "rgba(248, 250, 252, 0.7)",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <FiMoreHorizontal size={18} />
              More
              <FiChevronDown size={14} style={{ marginLeft: "2px" }} />
            </button>
            
            {showMore && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "rgba(15, 23, 42, 0.98)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "12px",
                  padding: "8px",
                  minWidth: "160px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                }}
              >
                {moreItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setShowMore(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: "#F8FAFC",
                      fontSize: "0.9rem",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(245, 158, 11, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Network & Wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <NetworkSwitcher />
          {connected && balance && (
            <div style={{ fontSize: "0.85rem", color: "rgba(248, 250, 252, 0.6)" }}>
              <span style={{ color: "#F59E0B" }}>{balance.sol}</span> SOL · ${balance.usd}
            </div>
          )}
    <WalletMultiButton className="connect-btn" style={{
      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      border: "none",
      color: "#0F172A",
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "0.85rem",
      fontFamily: "'IBM Plex Sans', sans-serif",
      cursor: "pointer",
      transition: "all 0.2s ease",
      height: "auto",
    }} />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;