import React, { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "chart" },
    { label: "Analytics", href: "/analytics", icon: "chart-bar" },
    { label: "Alerts", href: "/alerts", icon: "bell" },
    { label: "Bots", href: "/bots", icon: "robot" },
    { label: "Borrow", href: "/borrow", icon: "coins" },
    { label: "Support", href: "/support", icon: "question" },
    { label: "Profile", href: "/profile", icon: "user" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ginva-navy/95 backdrop-blur-md border-b border-ginva-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-ginva-gold rounded-lg"
            aria-label="GINVA Home"
          >
            <Icon
              name="building-office"
              size="lg"
              className="text-ginva-gold"
              ariaLabel="GINVA Logo"
            />
            <span className="text-xl font-display font-bold text-ginva-gold">
              GINVA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-6"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ginva-silver hover:text-ginva-gold transition-colors duration-200 font-medium text-sm min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-ginva-gold rounded"
              >
                <Icon
                  name={item.icon as any}
                  size="sm"
                  className="mr-1.5"
                  ariaLabel=""
                />
                {item.label}
              </Link>
            ))}
            <div className="flex items-center">
              <WalletMultiButton className="!bg-ginva-gold !text-ginva-navy hover:!bg-ginva-gold/90" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-ginva-silver hover:text-ginva-gold focus:outline-none focus:ring-2 focus:ring-ginva-gold rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <Icon name={isMenuOpen ? "close" : "menu"} size="lg" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 border-t border-ginva-slate"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-ginva-silver hover:text-ginva-gold transition-colors duration-200 font-medium px-4 py-3 min-h-[44px] flex items-center rounded-lg hover:bg-ginva-slate/50 focus:outline-none focus:ring-2 focus:ring-ginva-gold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon
                    name={item.icon as any}
                    size="md"
                    className="mr-3"
                    ariaLabel=""
                  />
                  {item.label}
                </Link>
              ))}
              <button
                className="btn-gold mx-4 px-6 py-3 rounded-lg text-ginva-navy font-semibold min-h-[44px] flex items-center justify-center"
                aria-label="Connect Wallet"
              >
                <Icon name="wallet" size="sm" className="mr-2" ariaLabel="" />
                Connect Wallet
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
