import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useGameStore } from "../../store/gameStore";
import { LogIn } from "lucide-react";

interface Props {
  userId: string;
}

export default function JoinGame({ userId }: Props) {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState("");
  const { setSessionId, setIsHost } = useGameStore();

  const handleJoinGame = async () => {
    if (!gameId) {
      setError("Please enter a game ID");
      return;
    }

    // First check if the game exists and is available
    const { data: gameSession } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", gameId)
      .eq("status", "waiting")
      .is("guest_id", null)
      .single();

    if (!gameSession) {
      setError("Invalid game ID or game is not available");
      return;
    }

    // Then try to join the game
    const { data: updatedSession, error: joinError } = await supabase
      .from("game_sessions")
      .update({
        guest_id: userId,
        status: "in_progress",
      })
      .eq("id", gameId)
      .select()
      .single();

    if (joinError || !updatedSession) {
      setError("Failed to join the game. Please try again.");
      return;
    }

    setSessionId(updatedSession.id);
    setIsHost(false);
    navigate(`/game/${updatedSession.id}`);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Join Game</h2>
      <div className="max-w-sm mx-auto space-y-4">
        <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Enter Game ID"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleJoinGame}
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Join Game
        </button>
      </div>
    </div>
  );
}
