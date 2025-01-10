import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import { useSession } from "../hooks/useSession";
import RoleSelection from "../components/game/RoleSelection";
import WordSelection from "../components/game/WordSelection";
import GameStatus from "../components/game/GameStatus";
import { XOctagon } from "lucide-react";
import { toast } from "react-toastify";
import { Database } from "../lib/database.types";

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [gameSession, setGameSession] = useState<
    Database["public"]["Tables"]["game_sessions"]["Row"] | null
  >(null);
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
          if (
            payload.new &&
            "status" in payload.new &&
            payload.new.status === "completed"
          ) {
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
              .select(
                `
                accepted,
                customer_id,
                seller_id,
                roles (name)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (roundData) {
              const sellerWon = roundData.accepted;
              toast[sellerWon ? "success" : "info"](
                sellerWon
                  ? "🎉 The seller's pitch was accepted! Moving to next round..."
                  : "❌ The seller's pitch was rejected. Moving to next round...",
                {
                  position: "top-center",
                  autoClose: 3000,
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

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1000);
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
