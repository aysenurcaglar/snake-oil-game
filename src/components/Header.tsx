// src/components/layout/Header.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex items-center justify-between py-8 max-w-4xl mx-auto">
      <div
        className="flex items-center justify-center cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="./snake-3-svgrepo-com.svg"
          alt="Snake"
          className="w-10 h-10 mr-2"
        />
        <h1 className="text-4xl font-bold text-white">Snake Oil</h1>
      </div>
      <div className="flex items-center">
        
        <Link
          to="/about"
          className="text-white text-xl hover:text-gray-300 transition-colors"
        >
          About
        </Link>
      </div>
      {user && (
        <div className="flex items-center">
          <h3 className="text-white text-xl mr-4">
            Welcome, {user?.user_metadata?.username || user?.email}
          </h3>
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 bg-transparent text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
