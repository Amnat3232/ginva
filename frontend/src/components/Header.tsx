import React, { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Analytics", href: "/analytics" },
    { label: "Alerts", href: "/alerts" },
    { label: "Bots", href: "/bots" },
    { label: "Borrow", href: "/borrow" },
    { label: "Support", href: "/support" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ginva-navy/95 backdrop-blur-md border-b border-ginva-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl font-display font-bold text-ginva-gold">
              GINVA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ginva-silver hover:text-ginva-gold transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
            <button className="btn-gold px-6 py-2 rounded-lg text-ginva-navy font-semibold hover:shadow-lg hover:shadow-ginva-gold/20 transition-all duration-300">
              Connect Wallet
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="text-2xl">🛡️</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-ginva-slate">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-ginva-silver hover:text-ginva-gold transition-colors duration-200 font-medium px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button className="btn-gold mx-4 px-6 py-2 rounded-lg text-ginva-navy font-semibold">
                Connect Wallet
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
