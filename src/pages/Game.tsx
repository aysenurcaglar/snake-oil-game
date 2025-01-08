import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import { useSession } from "../hooks/useSession";
import RoleSelection from "../components/game/RoleSelection";
import WordSelection from "../components/game/WordSelection";
import GameStatus from "../components/game/GameStatus";
import { XOctagon } from "lucide-react";
import { toast } from 'react-toastify';

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [gameSession, setGameSession] = useState<any>(null);
  const { isHost, leaveSession } = useGameStore();
  const channelRef = useRef<any>(null);

  const fetchSession = useCallback(async () => {
    if (!id) return;

    console.log("Fetching game session:", id);

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.status === "completed") {
        console.log("Game completed, navigating to home");
        navigate("/");
        return;
      }

      console.log("Fetched game session:", data);
      setGameSession(data);
    } catch (error) {
      console.error("Error fetching game session:", error);
      navigate("/");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !session?.user) return;

    // Initial fetch
    fetchSession();

    // Set up realtime subscription
    const channel = supabase.channel(`game_${id}`, {
      config: {
        broadcast: { self: true },
        presence: { key: session.user.id },
      },
    });

    channelRef.current = channel;

    // Subscribe to game session changes
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("Received game session update:", payload);
          if (payload.new.status === "completed") {
            navigate("/");
          } else {
            // Force a fresh state update
            setGameSession((prev: any) => {
              // Only update if the data is actually different
              if (JSON.stringify(prev) !== JSON.stringify(payload.new)) {
                return payload.new;
              }
              return prev;
            });
          }
        }
      )
      // Subscribe to round updates
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `session_id=eq.${id}`,
        },
        async (payload: any) => {
          if (payload.new && payload.new.accepted !== null) {
            const { data: roundData } = await supabase
              .from("rounds")
              .select(`
                accepted,
                customer_id,
                seller_id,
                roles (name)
              `)
              .eq("id", payload.new.id)
              .single();

            if (roundData) {
              const sellerWon = roundData.accepted;
              toast[sellerWon ? 'success' : 'info'](
                sellerWon 
                  ? "🎉 The seller's pitch was accepted! Moving to next round..." 
                  : "❌ The seller's pitch was rejected. Moving to next round...",
                {
                  position: "top-center",
                  autoClose: 3000
                }
              );
            }
          }
        }
      )
      .subscribe(async (status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          // Fetch latest state after subscription is established
          await fetchSession();
        }
      });

    // Cleanup subscription
    return () => {
      console.log("Cleaning up subscription");
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [id, session?.user, navigate, fetchSession]);

  const handleLeaveGame = async () => {
    if (!id || !session?.user) return;

    try {
      await leaveSession(id, session.user.id);
      navigate("/");
    } catch (error) {
      console.error("Error leaving game:", error);
    }
  };

  const handleReady = async () => {
    const field = isHost ? "host_ready" : "guest_ready";
    await supabase
      .from("game_sessions")
      .update({ [field]: true })
      .eq("id", id!);
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
            (!gameSession.host_ready || !gameSession.guest_ready) && (
            <>
              {isCustomer ? (
                <RoleSelection sessionId={id!} userId={session.user.id} />
              ) : (
                <WordSelection sessionId={id!} userId={session.user.id} />
              )}
              
              <div className="mt-6">
                <button
                  onClick={handleReady}
                  disabled={
                    (isHost && gameSession.host_ready) ||
                    (!isHost && gameSession.guest_ready)
                  }
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {(isHost && gameSession.host_ready) ||
                  (!isHost && gameSession.guest_ready)
                    ? "Ready!"
                    : "Mark as Ready"}
                </button>
              </div>
            </>
          )}
          <button
            onClick={handleLeaveGame}
            className="mt-6 inline-flex items-center px-4 py-2 text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <XOctagon className="w-5 h-5 mr-2" />
            Leave Game
          </button>

        </div>
      </div>
    </div>
  );
}
