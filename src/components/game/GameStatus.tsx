import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ChatBox from "./ChatBox";
import { motion } from "framer-motion";

interface GameSession {
  id: string;
  current_round: number | null;
  host_id: string;
  guest_id: string | null;
  status: "waiting" | "in_progress" | "completed" | null;
  host_ready: boolean | null;
  guest_ready: boolean | null;
  created_at: string | null;
}

interface Props {
  session: GameSession | null;
  isHost: boolean;
  userId: string;
}

export default function GameStatus({ session, isHost, userId }: Props) {
  const [customerRole, setCustomerRole] = useState<string>("");
  const [product, setProduct] = useState<{
    word1: string;
    word2: string;
  } | null>(null);

  useEffect(() => {
    let roundSubscription: any;

    const setupSubscription = async () => {
      await fetchRoundData();

      roundSubscription = supabase
        .channel("rounds-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rounds",
            filter: `session_id=eq.${session.id}`,
          },
          fetchRoundData
        )
        .subscribe();
    };

    const fetchRoundData = async () => {
      if (
        session?.status === "in_progress" &&
        session.host_ready &&
        session.guest_ready
      ) {
        const { data, error } = await supabase
          .from("rounds")
          .select(
            `
            selected_role_id,
            word1_id,
            word2_id,
            roles (
              name
            ),
            word1:words!word1_id (
              word
            ),
            word2:words!word2_id (
              word
            )
          `
          )
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data?.[0]) {
          setCustomerRole(data[0].roles?.name ?? "");
          setProduct({
            word1: data[0].word1?.word ?? "",
            word2: data[0].word2?.word ?? "",
          });
        }
      }
    };

    setupSubscription();

    return () => {
      if (roundSubscription) {
        supabase.removeChannel(roundSubscription);
      }
    };
  }, [session?.id, session?.status, session?.host_ready, session?.guest_ready]);

  const handleAccept = async (sessionId: string) => {
    try {
      await supabase
        .from("rounds")
        .update({ accepted: true })
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      await supabase
        .from("game_sessions")
        .update({
          current_round: session?.current_round ? session.current_round + 1 : 1,
          host_ready: false,
          guest_ready: false,
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error accepting pitch:", error);
    }
  };

  const handleReject = async (sessionId: string) => {
    try {
      await supabase
        .from("rounds")
        .update({ accepted: false })
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      await supabase
        .from("game_sessions")
        .update({
          current_round: session?.current_round ? session.current_round + 1 : 1,
          host_ready: false,
          guest_ready: false,
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error rejecting pitch:", error);
    }
  };

  if (!session) {
    return (
      <div className="text-center p-4 animate-pulse">
        <p>Loading game session...</p>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold">Game Over!</h2>
        <p>This game session has been completed.</p>
      </div>
    );
  }

  const isPlayerTurn =
    session.current_round !== null &&
    ((session.current_round % 2 === 1 && session.host_id === userId) ||
      (session.current_round % 2 === 0 && session.guest_id === userId));
  const role = isPlayerTurn ? "Customer" : "Seller";

  return (
    <div className="flex flex-col gap-4">
      <div className="card shadow-lg bg-glass w-full">
        <div className="card-body">
          {!session.guest_id ? (
            <>
              <h2 className="card-title self-center">Waiting for opponent...</h2>
              <p className="text-center">Share the game ID with your friend to start the game</p>
            </>
          ) : (
            <>
              <h2 className="card-title self-center">
                Round {session.current_round}
              </h2>
              {session.status === "in_progress" &&
              session.host_ready &&
              session.guest_ready ? (
                <>
                  <p>
                    Customer's Role:{" "}
                    <span className="font-semibold">{customerRole}</span>
                  </p>
                  <p>
                    Product:{" "}
                    <span className="font-semibold">
                      {product?.word1} {product?.word2}
                    </span>
                  </p>
                  {role === "Customer" && (
                    <div className="flex justify-center gap-4 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-outline btn-success"
                        onClick={() => handleAccept(session.id)}
                      >
                        Accept Pitch
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-outline btn-error"
                        onClick={() => handleReject(session.id)}
                      >
                        Reject Pitch
                      </motion.button>
                    </div>
                  )}
                </>
              ) : (
                <p>
                  You are the <span className="font-semibold">{role}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {session.status === "in_progress" &&
        session.host_ready &&
        session.guest_ready && (
          <div className="w-full">
            <ChatBox sessionId={session.id} userId={userId} />
          </div>
        )}
    </div>
  );
}
