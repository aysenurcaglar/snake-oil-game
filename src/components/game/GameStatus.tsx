import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ChatBox from "./ChatBox";
import { motion, AnimatePresence } from "framer-motion";

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
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-4"
      >
        <p>Loading game session...</p>
      </motion.div>
    );
  }

  const isPlayerTurn = session.current_round !== null && (
    (session.current_round % 2 === 1 && session.host_id === userId) ||
    (session.current_round % 2 === 0 && session.guest_id === userId)
  );
  const role = isPlayerTurn ? "Customer" : "Seller";
  const [customerRole, setCustomerRole] = useState<string>("");
  const [product, setProduct] = useState<{ word1: string; word2: string } | null>(null);

  useEffect(() => {
    let roundSubscription: any;

    const setupSubscription = async () => {
      // Initial fetch
      await fetchRoundData();

      // Subscribe to rounds table changes
      roundSubscription = supabase
        .channel('rounds-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rounds',
            filter: `session_id=eq.${session.id}`
          },
          async () => {
            await fetchRoundData();
          }
        )
        .subscribe();
    };

    const fetchRoundData = async () => {
      if (session.status === "in_progress" && session.host_ready && session.guest_ready) {
        const { data, error } = await supabase
          .from("rounds")
          .select(`
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
          `)
          .eq("session_id", session.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data?.[0]) {
          setCustomerRole(data[0].roles?.name ?? '');
          if (data[0].word1?.word && data[0].word2?.word) {
            setProduct({
              word1: data[0].word1.word,
              word2: data[0].word2.word
            });
          }
        }
      }
    };

    setupSubscription();

    // Cleanup subscription
    return () => {
      if (roundSubscription) {
        supabase.removeChannel(roundSubscription);
      }
    };
  }, [session?.id, session?.status, session?.host_ready, session?.guest_ready]);

  const handleAccept = async (sessionId: string) => {
    try {
      // First update the round result
      await supabase
        .from("rounds")
        .update({ accepted: true })
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      // Then update the game session to next round
      await supabase
        .from("game_sessions")
        .update({ 
          current_round: session?.current_round ? session.current_round + 1 : 1,
          host_ready: false,
          guest_ready: false
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error accepting pitch:", error);
    }
  };

  const handleReject = async (sessionId: string) => {
    try {
      // First update the round result
      await supabase
        .from("rounds")
        .update({ accepted: false })
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      // Then update the game session to next round
      await supabase
        .from("game_sessions")
        .update({ 
          current_round: session?.current_round ? session.current_round + 1 : 1,
          host_ready: false,
          guest_ready: false
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error rejecting pitch:", error);
    }
  };

  if (session.status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-4"
      >
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p>This game session has been completed.</p>
      </motion.div>
    );
  }

  if (
    session.status === "in_progress" &&
    session.host_ready &&
    session.guest_ready
  ) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.current_round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 p-4 rounded-lg shadow-lg text-center"
          >
            <h2 className="text-2xl font-semibold mb-2">
              Round {session.current_round}
            </h2>
            <div className="flex items-center justify-between text-lg text-white space-y-2 mb-4">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Customer's Role: <span className="font-semibold">{customerRole}</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Product:{" "}
                <span className="font-semibold">
                  {product ? `${product.word1} ${product.word2}` : ""}
                </span>
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ChatBox sessionId={session.id} userId={userId} />
        </motion.div>

        {role === "Customer" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center mt-4 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAccept(session.id)}
              className="relative px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md border-2 border-emerald-500 text-emerald-500 bg-transparent transition-all duration-200"
            >
              Accept Pitch
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReject(session.id)}
              className="relative px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md border-2 border-rose-500 text-rose-500 bg-transparent transition-all duration-200"
            >
              Reject Pitch
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center p-4"
    >
      <h2 className="text-2xl font-semibold mb-2">
        Round {session.current_round}
      </h2>
      <p className="text-lg text-white mb-4">
        You are the <span className="font-semibold">{role}</span>
      </p>
      
    </motion.div>
  );
}
