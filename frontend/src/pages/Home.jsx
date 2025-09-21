import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Youtube, LogIn } from "lucide-react"; // Lucide icons
import { baseUrl } from "../config";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in
  const checkAuth = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          navigate("/dashboard");
          return;
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const handleLogin = () => {
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-700 text-lg">Checking login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Youtube className="w-14 h-14 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          YouTube Dashboard
        </h1>
        <p className="mb-8 text-gray-600">
          Login with Google to manage your uploaded videos.
        </p>
        <button
          onClick={handleLogin}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          <LogIn className="w-5 h-5" />
          Login with Google
        </button>
      </div>
    </div>
  );
}
