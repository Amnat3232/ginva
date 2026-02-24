import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ginva-slate border-t border-ginva-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🏛️</span>
              <span className="text-xl font-display font-bold text-ginva-gold">
                GINVA
              </span>
            </div>
            <p className="text-ginva-silver mb-4 max-w-md">
              "Distribute Revenue, Deliver Happiness, Provide Safety, Build
              Trust"
            </p>
            <p className="text-sm text-ginva-silver">
              The most fair financial platform on Solana
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-ginva-gold font-semibold mb-4">
              Documentation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs/architecture"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/deployment"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  Deployment
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/security"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-ginva-gold font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/Dr-SoloDev/ginva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/ginva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/ginva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-ginva-navy text-center">
          <p className="text-ginva-silver text-sm">
            © 2024 GINVA Protocol. Built with ❤️ on Solana
          </p>
          <p className="text-ginva-silver text-xs mt-2">
            "Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"
          </p>
        </div>
      </div>
    </footer>
  );
}
