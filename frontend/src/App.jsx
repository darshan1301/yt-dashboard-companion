import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import VideoDetail from "./pages/Video";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video/:id" element={<VideoDetail />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;
