import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import TurnstileGate from "./pages/TurnstileGate";

function GateGuard({ children }: any) {
  const passed = localStorage.getItem("turnstile_passed") === "true";
  return passed ? children : <Navigate to="/verify" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify" element={<TurnstileGate />} />
        <Route
          path="/*"
          element={
            <GateGuard>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* your other routes */}
              </Routes>
            </GateGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
