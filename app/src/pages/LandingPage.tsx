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
    { name: "Twitter", icon: "𝕏" },
    { name: "Discord", icon: "💬" },
    { name: "Telegram", icon: "✈️" },
    { name: "GitHub", icon: "🐙" },
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
                color: "#f59e0b",
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
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
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
