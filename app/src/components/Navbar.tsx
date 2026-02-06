import { FiCreditCard, FiActivity } from "react-icons/fi";
import {
  Button,
  Container,
  Nav,
  Navbar as BootstrapNavbar,
} from "react-bootstrap";

const Navbar = () => {
  return (
    <BootstrapNavbar bg="white" className="shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand href="/">
          <FiActivity size={24} color="#16a34a" className="me-2" />
          <span
            style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a" }}
          >
            Ginva
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
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
          <Button variant="outline-success">
            <FiCreditCard className="me-2" />
            Connect Wallet
          </Button>
        </Navbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
