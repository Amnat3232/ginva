import {
  FiActivity,
  FiZap,
  FiShield,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { Container, Nav, Navbar as BootstrapNavbar } from "react-bootstrap";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useState } from "react";

const Navbar = () => {
  const { connected, publicKey } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkStyle = {
    color: "rgba(255, 255, 255, 0.7)",
    transition: "all 0.2s ease",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    fontFamily: "'Exo 2', sans-serif",
  };

  const navLinkHoverStyle = {
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.1)",
  };

  const brandStyle = {
    fontFamily: "'Exo 2', sans-serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#10b981 !important",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const glassStyle = {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
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
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiActivity size={18} color="white" />
          </div>
          <span className="d-none d-sm-inline">GINVA</span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="basic-navbar-nav"
          style={{
            border: "none",
            color: "#10b981",
          }}
        >
          {menuOpen ? (
            <FiX size={24} color="#10b981" />
          ) : (
            <FiMenu size={24} color="#10b981" />
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
              style={{ ...navLinkStyle, color: "#8b5cf6" }}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkHoverStyle,
                  color: "#8b5cf6",
                })
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, {
                  ...navLinkStyle,
                  color: "#8b5cf6",
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
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                }}
              >
                <span
                  style={{
                    color: "#10b981",
                    fontSize: "13px",
                    fontFamily: "'Exo 2', sans-serif",
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
                  fontFamily: "'Exo 2', sans-serif",
                }}
              />
            </div>
          ) : (
            <WalletModalButton
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                padding: "10px 20px",
                fontWeight: 600,
                fontFamily: "'Exo 2', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
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
