import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import CreateGame from "../components/home/CreateGame";
import JoinGame from "../components/home/JoinGame";
import { LogOut } from "lucide-react";

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

  if (!user) return null;

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
