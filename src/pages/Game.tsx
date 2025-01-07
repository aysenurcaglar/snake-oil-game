import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import { useSession } from "../hooks/useSession";
import GameHeader from "../components/game/GameHeader";
import RoleSelection from "../components/game/RoleSelection";
import WordSelection from "../components/game/WordSelection";
import GameStatus from "../components/game/GameStatus";
import { LogOut } from "lucide-react";

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [gameSession, setGameSession] = useState<any>(null);
  const { isHost, leaveSession } = useGameStore();

  useEffect(() => {
    if (!id || !session?.user) return;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      if (data.status === "completed") {
        navigate("/");
        return;
      }

      setGameSession(data);
    };

    fetchSession();

    const subscription = supabase
      .channel(`game_${id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${id}`,
        },
        (payload: { new: any }) => {
          if (payload.new.status === "completed") {
            navigate("/");
          } else {
            setGameSession(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, session?.user, navigate]);

  const handleLeaveGame = async () => {
    if (id && session?.user) {
      await leaveSession(id, session.user.id);
      navigate("/");
    }
  };

  if (loading || !session?.user || !gameSession) return null;

  const isCustomer =
    gameSession.current_round % 2 === 1
      ? gameSession.host_id === session.user.id
      : gameSession.guest_id === session.user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/20 text-white rounded-lg shadow-xl p-6 mt-8 text-center">
          <div className="flex items-center justify-center gap-8">
            <h3 className="text-2xl font-semibold mt-4">Game ID: {id!}</h3>
          </div>
          <GameStatus
            session={gameSession}
            isHost={isHost}
            userId={session.user.id}
          />

          {gameSession.status === "in_progress" &&
            (isCustomer ? (
              <RoleSelection sessionId={id!} userId={session.user.id} />
            ) : (
              <WordSelection sessionId={id!} userId={session.user.id} />
            ))}
          <button
            onClick={handleLeaveGame}
            className="inline-flex items-center px-4 py-2 text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
