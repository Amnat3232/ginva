// Navbar Component
import { useState, useEffect } from "react";
import { Page } from "../types";

interface NavbarProps {
  page?: Page;
  connected?: boolean;
  walletAddress?: string;
  onNavigate?: (page: Page) => void;
  onConnect?: () => void;
}

// Fake balance that updates randomly
const getFakeBalance = () => {
  const solBase = 12.5 + Math.random() * 3;
  const solUsd = solBase * 182;
  return {
    sol: solBase.toFixed(1),
    usd: Math.round(solUsd).toLocaleString(),
  };
};

export function Navbar({
  page,
  connected,
  walletAddress,
  onNavigate,
  onConnect,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [balance, setBalance] = useState(getFakeBalance());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update balance every 15 seconds when connected
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      setBalance(getFakeBalance());
    }, 15000);
    return () => clearInterval(interval);
  }, [connected]);

  return (
    <nav
      className="navbar"
      style={{
        background: scrolled ? "rgba(5,12,6,0.95)" : "rgba(5,12,6,0.85)",
        borderBottom: "1px solid var(--border)",
        height: scrolled ? "56px" : "64px",
        transition: "all 0.2s ease",
      }}
    >
      <div className="navbar-inner">
        <div className="logo" onClick={() => onNavigate?.("landing")}>
          <div className="logo-dot" />
          GINVA
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${page === "landing" ? "active" : ""}`}
            onClick={() => onNavigate?.("landing")}
          >
            Home
          </button>
          <button
            className={`nav-btn ${page === "borrow" ? "active" : ""}`}
            onClick={() => onNavigate?.("borrow")}
          >
            Borrow
          </button>
          <button
            className={`nav-btn ${page === "keeper" ? "active" : ""}`}
            onClick={() => onNavigate?.("keeper")}
          >
            Keepers
          </button>
          <button
            className={`nav-btn ${page === "support" ? "active" : ""}`}
            onClick={() => onNavigate?.("support")}
          >
            Support
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {connected && (
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              <span style={{ color: "var(--green)" }}>{balance.sol}</span> SOL ·
              ${balance.usd}
            </div>
          )}
          <button
            className={`connect-btn ${connected ? "connected" : ""}`}
            onClick={() => onConnect?.()}
          >
            {connected ? `◎ ${walletAddress ?? ""}` : "Connect Wallet"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
