import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Pawn from "./pages/Pawn";
import Redeem from "./pages/Redeem";

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />
      <Container fluid>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/pawn" element={<Pawn />} />
          <Route path="/redeem" element={<Redeem />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
