import { Routes, Route } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Borrow from "./pages/Borrow";
import Repay from "./pages/Repay";

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/borrow" element={<Borrow />} />
        <Route path="/repay" element={<Repay />} />
      </Routes>
    </Box>
  );
}

export default App;
