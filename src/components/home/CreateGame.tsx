import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useGameStore } from "../../store/gameStore";
import { Plus } from "lucide-react";

interface Props {
  userId: string;
}

export default function CreateGame({ userId }: Props) {
  const navigate = useNavigate();
  const { setSessionId, setIsHost } = useGameStore();

  const handleCreateGame = async () => {
    const { data, error } = await supabase
      .from("game_sessions")
      .insert([
        {
          host_id: userId,
          status: "waiting",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating game:", error);
      return;
    }

    setSessionId(data.id);
    setIsHost(true);
    navigate(`/game/${data.id}`);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Create New Game</h2>
      <button
        onClick={handleCreateGame}
        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Game
      </button>
    </div>
  );
}
