import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../store/gameStore";
import { Play } from "lucide-react";

interface Props {
  userId: string;
}

export default function JoinGame({ userId }: Props) {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState("");
  const { joinGame, error } = useGameStore();

  const handleJoinGame = async () => {
    const success = await joinGame(gameId, userId);
    if (success) {
      navigate(`/game/${gameId}`);
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
