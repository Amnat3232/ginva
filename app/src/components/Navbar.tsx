import { FiActivity, FiZap, FiShield, FiUser } from "react-icons/fi";
import { Container, Nav, Navbar as BootstrapNavbar } from "react-bootstrap";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

const Navbar = () => {
  const { connected, publicKey } = useWallet();

  return (
    <BootstrapNavbar bg="white" className="shadow-sm" sticky="top">
      <Container fluid className="px-2">
        <BootstrapNavbar.Brand href="/" className="me-2">
          <FiActivity size={20} color="#16a34a" className="me-1" />
          <span
            style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a" }}
            className="d-none d-sm-inline"
          >
            Ginva
          </span>
          <span
            style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a" }}
            className="d-inline d-sm-none"
          >
            G
          </span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto flex-wrap">
            <Nav.Link href="/" className="me-2 py-1 px-2">
              <small>Dashboard</small>
            </Nav.Link>
            <Nav.Link href="/earn" className="me-2 py-1 px-2">
              <small>Earn</small>
            </Nav.Link>
            <Nav.Link href="/pawn" className="me-2 py-1 px-2">
              <small>Pawn</small>
            </Nav.Link>
            <Nav.Link href="/redeem" className="me-2 py-1 px-2">
              <small>Redeem</small>
            </Nav.Link>
            <Nav.Link href="/my-tickets" className="me-2 py-1 px-2">
              <small>Tickets</small>
            </Nav.Link>
            <Nav.Link href="/storefront" className="me-2 py-1 px-2">
              <small>Store</small>
            </Nav.Link>
            <Nav.Link
              href="/keeper"
              className="me-2 py-1 px-2 text-warning fw-bold"
            >
              <FiZap className="me-1" />
              <small>Keeper</small>
            </Nav.Link>
            <Nav.Link
              href="/agent"
              className="me-2 py-1 px-2 text-info fw-bold"
            >
              <FiUser className="me-1" />
              <small>Agent</small>
            </Nav.Link>
            <Nav.Link
              href="/admin"
              className="me-2 py-1 px-2 text-danger fw-bold"
            >
              <FiShield className="me-1" />
              <small>Admin</small>
            </Nav.Link>
          </Nav>
          {connected ? (
            <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
              <span className="text-muted small">
                {publicKey?.toString().slice(0, 4)}...
                {publicKey?.toString().slice(-4)}
              </span>
              <WalletDisconnectButton />
            </div>
          ) : (
            <WalletModalButton />
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
