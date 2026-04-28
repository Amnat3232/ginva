// Navbar Component - Refactored with Tailwind
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FiHome, FiDollarSign, FiZap, FiUser, FiSettings, FiHelpCircle, FiClock, FiMoreHorizontal, FiChevronDown, FiArrowLeft } from "react-icons/fi";
import { cn } from "@/lib/utils";
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
      className={cn(
        "sticky top-0 z-sticky transition-all duration-200",
        "backdrop-blur-md border-b",
        scrolled
          ? "bg-ginva-bg/95 h-14"
          : "bg-ginva-bg/85 h-16",
        "border-ginva-green/20"
      )}
    >
      {/* Max-width container */}
      <div className="max-w-[1400px] mx-auto w-full h-full px-6 flex items-center justify-between">

        {/* Left side - Back button or Logo */}
        <div className="flex items-center gap-3">
          {isBackPage && !isLanding && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg
                         bg-white/10 text-ginva-text hover:bg-white/20
                         transition-colors touch-target"
              title="Go back"
            >
              <FiArrowLeft size={20} />
            </button>
          )}

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {/* Logo dot with glow */}
            <div
              className="w-2 h-2 rounded-full bg-ginva-green"
              style={{ boxShadow: "0 0 10px #00e676" }}
            />
            <span className="text-ginva-text font-semibold text-lg font-body">
              GINVA
            </span>
          </div>
        </div>

        {/* Center - Nav Links (Desktop) */}
        <div className="flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                "touch-target",
                isActive(item.path)
                  ? "bg-ginva-green/15 text-ginva-green"
                  : "text-ginva-text-secondary/70 hover:text-ginva-text-secondary hover:bg-ginva-bg-tertiary/50"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                "text-ginva-text-secondary/70 hover:text-ginva-text-secondary",
                "touch-target"
              )}
            >
              <FiMoreHorizontal size={18} />
              More
              <FiChevronDown size={14} className="ml-0.5" />
            </button>

            {showMore && (
              <div
                className="absolute top-full right-0 mt-2 py-2 min-w-[160px] rounded-xl
                           bg-ginva-bg border border-ginva-green/20
                           shadow-xl"
              >
                {moreItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setShowMore(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5
                               text-sm text-ginva-text
                               hover:bg-ginva-green/10 transition-colors"
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
        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          {connected && balance && (
            <div className="text-sm text-ginva-text-secondary/60">
              <span className="text-ginva-green">{balance.sol}</span> SOL · ${balance.usd}
            </div>
          )}
          <WalletMultiButton
            className="!bg-gradient-to-r !from-ginva-green !to-ginva-green-dim
                       !text-ginva-bg !border-none !rounded-lg !font-semibold
                       !text-sm !px-4 !py-2 !h-auto !cursor-pointer
                       !transition-all hover:!brightness-110"
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;