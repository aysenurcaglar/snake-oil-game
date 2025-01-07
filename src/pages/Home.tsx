import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import CreateGame from "../components/home/CreateGame";
import JoinGame from "../components/home/JoinGame";
import { LogOut } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, ensureUsername } = useAuthStore();

  useEffect(() => {
    // Only navigate away if we're not loading and there's no user
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      ensureUsername();
    }
  }, [user, loading, navigate, ensureUsername]);

  // Show nothing while loading or if no user
  if (loading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/20 rounded-lg shadow-xl p-6 space-y-8">
          <CreateGame userId={user.id} />
          <div className="border-t border-gray-200" />
          <JoinGame userId={user.id} />
        </div>
      </div>
    </div>
  );
}
