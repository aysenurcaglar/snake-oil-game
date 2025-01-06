import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import CreateGame from "../components/home/CreateGame";
import JoinGame from "../components/home/JoinGame";
import { Users, LogOut } from "lucide-react";
import Snake from "./snake-3-svgrepo-com.svg";

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut, ensureUsername } = useAuthStore();
  const { leaveSession } = useGameStore();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      ensureUsername();
    }
  }, [user, navigate, ensureUsername]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center justify-center">
            <img
              src="./snake-3-svgrepo-com.svg"
              alt="Snake"
              className="w-10 h-10 mr-2"
            />
            <h1 className="text-4xl font-bold text-white">Snake Oil</h1>
          </div>
          <div className="flex items-center">
            <h3 className="text-white text-xl mr-4">
              Welcome, {user.user_metadata.username || user.email}
            </h3>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 bg-transparent text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white/20 rounded-lg shadow-xl p-6 space-y-8">
          <CreateGame userId={user.id} />
          <div className="border-t border-gray-200" />
          <JoinGame userId={user.id} />
        </div>
      </div>
    </div>
  );
}
