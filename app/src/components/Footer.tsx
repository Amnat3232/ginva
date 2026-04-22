import { ExternalLink } from 'lucide-react';

const FOOTER_COLS = [
  {
    title: 'Protocol',
    links: ['Borrow', 'Earn', 'Pawn Shop', 'Keeper', 'AI Agent'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'GitHub', 'Security Audit', 'Risk Disclosure'],
  },
  {
    title: 'Community',
    links: ['Discord', 'Twitter/X', 'Telegram', 'Forum'],
  },
  {
    title: 'Legal',
    links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy'],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ginva-bg border-t border-white/[0.08] py-12 px-[5vw] relative z-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-medium text-sm text-ginva-text mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-ginva-text-secondary hover:text-ginva-text transition-colors cursor-pointer flex items-center gap-1">
                      {link}
                      <ExternalLink size={10} className="opacity-50" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-xs text-ginva-text-muted">
            Built with Pinocchio on Solana &middot; 2026 GINVA
          </span>
          <span className="font-mono text-xs text-ginva-text-muted">
            Program: Ev9HTrf...RtQm3D
          </span>
        </div>
      </div>
    </footer>
  );
}
