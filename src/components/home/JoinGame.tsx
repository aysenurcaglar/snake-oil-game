import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useGameStore } from "../../store/gameStore";
import { Play } from "lucide-react";

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

    try {
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

      // Update both fields in a single operation
      const { error: updateError } = await supabase
        .from("game_sessions")
        .update({
          guest_id: userId,
          status: "in_progress",
        })
        .eq("id", gameId);

      if (updateError) throw updateError;

      setSessionId(gameId);
      setIsHost(false);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Failed to join the game. Please try again.");
    }
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
          className="input input-primary bg-transparent w-full"
        />
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        <button onClick={handleJoinGame} className="btn btn-primary gap-2">
          <Play className="w-5 h-5" />
          Join Game
        </button>
      </div>
    </div>
  );
}
