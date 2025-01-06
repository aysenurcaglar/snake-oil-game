import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import CreateGame from "../components/home/CreateGame";
import JoinGame from "../components/home/JoinGame";
import { Users } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center mb-8">
            <Users className="w-12 h-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Snake Oil</h1>
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
