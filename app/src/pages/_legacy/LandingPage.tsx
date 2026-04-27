import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import Features from "../sections/Features";
import HowItWorks from "../sections/HowItWorks";
import Borrow from "../sections/Borrow";
import LendingPools from "../sections/LendingPools";
import LiquidationDeals from "../sections/LiquidationDeals";
import FAQ from "../sections/FAQ";
import CTA from "../sections/CTA";

const Footer = () => {
  const footerLinks = {
    Protocol: ["Borrow", "Lend", "Liquidations", "API"],
    Community: ["Discord", "Twitter", "GitHub", "Telegram"],
    Legal: ["Terms of Service", "Privacy Policy", "Risk Disclaimer"],
  };

  const socialIcons = [
    {
      name: "Twitter",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
          <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
      ),
    },
    {
      name: "Discord",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
          <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
          <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3" />
          <path d="M7 16.5c3.5 1 6.5 1 10 0" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21 8-2.13 9.63a2 2 0 0 1-1.66 1.12l-2.93.78a2 2 0 0 0-1.87.87L8.28 17a2 2 0 0 1-2.83-2.08l1.1-4.11a2 2 0 0 0-.76-1.59L4.6 6.6a2 2 0 0 1 2.75-1.59l3.66 1.41l2.57-3.54a2 2 0 0 1 3.23 1.63l-1.66 6.56z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      style={{
        padding: "60px 20px 30px",
        background: "#050508",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#00e676",
                marginBottom: "15px",
              }}
            >
              GINVA
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.5)",
                lineHeight: 1.6,
              }}
            >
              Decentralized lending protocol on Solana. Unlock liquidity without
              selling your assets.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {category}
              </div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {links.map((link) => (
                  <li key={link} style={{ marginBottom: "10px" }}>
                    <a
                      href="#"
                      className="footer-link"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        color: "rgba(255, 255, 255, 0.5)",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            © 2024 GINVA Protocol. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "15px" }}>
            {socialIcons.map((social) => (
              <a
                key={social.name}
                href="#"
                className="social-icon"
                aria-label={social.name}
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.6)",
                  transition: "all 0.2s ease",
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .footer-link {
          position: relative;
          text-decoration: none;
        }
        .footer-link:hover {
          color: #00e676 !important;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #00e676;
          transition: width 0.2s ease;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .social-icon:hover {
          background: rgba(0, 230, 118, 0.15) !important;
          border-color: #00e676 !important;
          color: #00e676 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
};

const LandingPage = () => {
  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Borrow />
      <LendingPools />
      <LiquidationDeals />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
