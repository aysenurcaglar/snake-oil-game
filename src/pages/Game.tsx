import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { useSession } from "../hooks/useSession";
import RoleSelection from "../components/game/RoleSelection";
import WordSelection from "../components/game/WordSelection";
import GameStatus from "../components/game/GameStatus";
import { XOctagon } from "lucide-react";

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const {
    isHost,
    gameSession,
    fetchGameSession,
    subscribeToGameSession,
    unsubscribeFromGameSession,
    leaveSession,
    markReady,
  } = useGameStore();

  useEffect(() => {
    if (!id || !session?.user) return;

    // Initial fetch
    fetchGameSession(id);

    // Set up realtime subscription
    subscribeToGameSession(id, session.user.id, () => navigate("/"));

    // Cleanup subscription
    return () => {
      unsubscribeFromGameSession();
    };
  }, [id, session?.user, navigate]);

  const handleLeaveGame = async () => {
    if (!id || !session?.user) return;

    try {
      await leaveSession(id, session.user.id);
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  };

  const handleReady = async () => {
    if (!id) return;
    await markReady(id, isHost);
  };

  if (loading || !session?.user || !gameSession) return null;

  const isCustomer =
    gameSession &&
    gameSession.current_round !== null &&
    (gameSession.current_round % 2 === 1
      ? gameSession.host_id === session.user.id
      : gameSession.guest_id === session.user.id);

  return (
    <div className="min-h-screen container mx-auto px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-center">
          Game ID: {id!}
        </h3>

        <div className="rounded-lg bg-glass shadow-xl p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-8"></div>
          <GameStatus
            session={gameSession}
            isHost={isHost}
            userId={session.user.id}
          />

          {gameSession.status === "in_progress" &&
            (!gameSession.host_ready || !gameSession.guest_ready) && (
              <div className="space-y-4 sm:space-y-6">
                {isCustomer ? (
                  <RoleSelection sessionId={id!} userId={session.user.id} />
                ) : (
                  <WordSelection sessionId={id!} userId={session.user.id} />
                )}

                <div>
                  <button
                    onClick={handleReady}
                    disabled={
                      (isHost && (gameSession?.host_ready ?? false)) ||
                      (!isHost && (gameSession?.guest_ready ?? false))
                    }
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    {(isHost && (gameSession?.host_ready ?? false)) ||
                    (!isHost && (gameSession?.guest_ready ?? false))
                      ? "Ready!"
                      : "Mark as Ready"}
                  </button>
                </div>
              </div>
            )}
          <button
            onClick={handleLeaveGame}
            className="btn btn-outline btn-primary mt-4 sm:mt-6 w-full sm:w-auto"
          >
            <XOctagon className="w-5 h-5 mr-2" />
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
