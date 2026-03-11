import { Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Loading from "./components/ui/Loading";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Earn = lazy(() => import("./pages/Earn"));
const Pawn = lazy(() => import("./pages/Pawn"));
const Redeem = lazy(() => import("./pages/Redeem"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Storefront = lazy(() => import("./pages/Storefront"));
const Keeper = lazy(() => import("./pages/Keeper"));
const Agent = lazy(() => import("./pages/Agent"));
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />
      <Container fluid>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/earn" element={<Earn />} />
            <Route path="/pawn" element={<Pawn />} />
            <Route path="/redeem" element={<Redeem />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/storefront" element={<Storefront />} />
            <Route path="/keeper" element={<Keeper />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Container>
    </div>
  );
}

export default App;
