import { FiActivity, FiZap, FiShield } from "react-icons/fi";
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
      <Container>
        <BootstrapNavbar.Brand href="/">
          <FiActivity size={24} color="#16a34a" className="me-2" />
          <span
            style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a" }}
          >
            Ginva
          </span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" className="me-3">
              Dashboard
            </Nav.Link>
            <Nav.Link href="/earn" className="me-3">
              Earn
            </Nav.Link>
            <Nav.Link href="/pawn" className="me-3">
              Pawn
            </Nav.Link>
            <Nav.Link href="/redeem" className="me-3">
              Redeem
            </Nav.Link>
            <Nav.Link href="/my-tickets" className="me-3">
              My Tickets
            </Nav.Link>
            <Nav.Link href="/storefront" className="me-3">
              Storefront
            </Nav.Link>
            <Nav.Link href="/keeper" className="me-3 text-warning fw-bold">
              <FiZap className="me-1" />
              Keeper
            </Nav.Link>
            <Nav.Link href="/admin" className="me-3 text-danger fw-bold">
              <FiShield className="me-1" />
              Admin
            </Nav.Link>
          </Nav>
          {connected ? (
            <div className="d-flex align-items-center gap-2">
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
