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
              "กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"
            </p>
            <p className="text-sm text-ginva-silver">
              แพลตฟอร์มการเงินที่ยุติธรรมที่สุดบน Solana
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-ginva-gold font-semibold mb-4">เอกสาร</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs/architecture"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  สถาปัตยกรรม
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/deployment"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  การ Deploy
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/security"
                  className="text-ginva-silver hover:text-ginva-cyan transition-colors"
                >
                  ความปลอดภัย
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-ginva-gold font-semibold mb-4">ชุมชน</h3>
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
            © 2024 GINVA Protocol. สร้างด้วย ❤️ บน Solana
          </p>
          <p className="text-ginva-silver text-xs mt-2">
            "กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"
          </p>
        </div>
      </div>
    </footer>
  );
}
