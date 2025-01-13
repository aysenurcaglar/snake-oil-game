import { useEffect } from "react";
import ChatBox from "./ChatBox";
import { motion } from "framer-motion";
import { useRoundsStore } from "../../store/roundsStore";

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
  const {
    customerRole,
    product,
    subscribeToRoundChanges,
    fetchRoundData,
    handleAccept,
    handleReject,
    cleanup,
  } = useRoundsStore();

  useEffect(() => {
    if (
      session?.id &&
      session.status === "in_progress" &&
      session.host_ready &&
      session.guest_ready
    ) {
      // Initial fetch
      fetchRoundData(session.id);
      // Setup subscription
      subscribeToRoundChanges(session.id);
    }

    return () => {
      cleanup();
    };
  }, [session?.id, session?.status, session?.host_ready, session?.guest_ready]);

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
              <h2 className="card-title self-center">
                Waiting for opponent...
              </h2>
              <p className="text-center">
                Share the game ID with your friend to start the game
              </p>
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
                        className="btn btn-outline btn-info"
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
