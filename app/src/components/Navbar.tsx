import { FiZap, FiShield, FiUser, FiMenu, FiX } from "react-icons/fi";
import { Container, Nav, Navbar as BootstrapNavbar } from "react-bootstrap";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import logo from "../../public/images/logos/ginva-logo-v3.jpg";

const Navbar = () => {
  const { connected, publicKey } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkStyle = {
    color: "rgba(255, 255, 255, 0.7)",
    transition: "all 0.2s ease",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
  };

  const navLinkHoverStyle = {
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
  };

  const brandStyle = {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: "22px",
    color: "#f59e0b !important",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
  };

  const glassStyle = {
    background: scrolled ? "rgba(10, 10, 15, 0.95)" : "rgba(10, 10, 15, 0.8)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
    boxShadow: scrolled
      ? "0 4px 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.1)"
      : "0 4px 30px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
    padding: scrolled ? "8px 0" : "12px 0",
  };

  return (
    <BootstrapNavbar
      style={glassStyle}
      className="shadow-sm"
      sticky="top"
      expand="lg"
      onToggle={() => setMenuOpen(!menuOpen)}
      expanded={menuOpen}
    >
      <Container fluid className="px-3 py-2">
        <BootstrapNavbar.Brand
          href="/"
          style={brandStyle}
          onClick={() => setMenuOpen(false)}
        >
          <img
            src={logo}
            alt="GINVA"
            style={{
              height: "28px",
              width: "auto",
            }}
          />
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="basic-navbar-nav"
          style={{
            border: "none",
            color: "#f59e0b",
          }}
        >
          {menuOpen ? (
            <FiX size={24} color="#f59e0b" />
          ) : (
            <FiMenu size={24} color="#f59e0b" />
          )}
        </BootstrapNavbar.Toggle>

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto flex-wrap gap-1">
            <Nav.Link
              href="/"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link
              href="/earn"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Earn
            </Nav.Link>
            <Nav.Link
              href="/pawn"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Borrow
            </Nav.Link>
            <Nav.Link
              href="/redeem"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Redeem
            </Nav.Link>
            <Nav.Link
              href="/my-tickets"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Tickets
            </Nav.Link>
            <Nav.Link
              href="/storefront"
              className="mx-1"
              style={navLinkStyle}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, navLinkHoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, navLinkStyle)
              }
              onClick={() => setMenuOpen(false)}
            >
              Store
            </Nav.Link>
            <Nav.Link
              href="/keeper"
              className="mx-1"
              style={{ ...navLinkStyle, color: "#f59e0b" }}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkHoverStyle,
                  color: "#f59e0b",
                })
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkStyle,
                  color: "#f59e0b",
                })
              }
              onClick={() => setMenuOpen(false)}
            >
              <FiZap className="me-1" />
              Keeper
            </Nav.Link>
            <Nav.Link
              href="/agent"
              className="mx-1"
              style={{ ...navLinkStyle, color: "#a855f7" }}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkHoverStyle,
                  color: "#a855f7",
                })
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkStyle,
                  color: "#a855f7",
                })
              }
              onClick={() => setMenuOpen(false)}
            >
              <FiUser className="me-1" />
              Agent
            </Nav.Link>
            <Nav.Link
              href="/admin"
              className="mx-1"
              style={{ ...navLinkStyle, color: "#ef4444" }}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkHoverStyle,
                  color: "#ef4444",
                })
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkStyle,
                  color: "#ef4444",
                })
              }
              onClick={() => setMenuOpen(false)}
            >
              <FiShield className="me-1" />
              Admin
            </Nav.Link>
          </Nav>
          {connected ? (
            <div
              className="d-flex align-items-center gap-3 mt-3 mt-lg-0"
              style={{ padding: "8px 0" }}
            >
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                }}
              >
                <span
                  style={{
                    color: "#f59e0b",
                    fontSize: "13px",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {publicKey?.toString().slice(0, 4)}...
                  {publicKey?.toString().slice(-4)}
                </span>
              </div>
              <WalletDisconnectButton
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  color: "#ef4444",
                  fontSize: "13px",
                  padding: "6px 12px",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                }}
              />
            </div>
          ) : (
            <WalletModalButton
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontSize: "14px",
                padding: "10px 20px",
                fontWeight: 600,
                fontFamily: "'Rajdhani', sans-serif",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Connect Wallet
            </WalletModalButton>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
