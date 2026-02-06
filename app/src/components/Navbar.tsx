import { FiCreditCard, FiActivity } from "react-icons/fi";
import {
  Button,
  Container,
  Nav,
  Navbar as BootstrapNavbar,
} from "react-bootstrap";
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
            <Nav.Link href="/dashboard" className="me-3">
              Dashboard
            </Nav.Link>
            <Nav.Link href="/deposit" className="me-3">
              Deposit
            </Nav.Link>
            <Nav.Link href="/borrow" className="me-3">
              Borrow
            </Nav.Link>
            <Nav.Link href="/repay" className="me-3">
              Repay
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
