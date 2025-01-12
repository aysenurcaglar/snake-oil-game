import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../store/gameStore";
import { Plus } from "lucide-react";

interface Props {
  userId: string;
}

export default function CreateGame({ userId }: Props) {
  const navigate = useNavigate();
  const { createGame, error } = useGameStore();

  const handleCreateGame = async () => {
    const gameId = await createGame(userId);
    if (gameId) {
      navigate(`/game/${gameId}`);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Create New Game</h2>
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      <button onClick={handleCreateGame} className="btn btn-primary gap-2">
        <Plus className="w-5 h-5" />
        Create Game
      </button>
    </div>
  );
}
