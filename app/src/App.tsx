import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Earn from "./pages/Earn";
import Pawn from "./pages/Pawn";
import Redeem from "./pages/Redeem";
import MyTickets from "./pages/MyTickets";
import Storefront from "./pages/Storefront";
import Keeper from "./pages/Keeper";
import Admin from "./pages/Admin";

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />
      <Container fluid>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/earn" element={<Earn />} />
          <Route path="/pawn" element={<Pawn />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/keeper" element={<Keeper />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
