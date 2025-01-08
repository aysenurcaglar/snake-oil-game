import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ChatBox from "./ChatBox";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  session: any;
  isHost: boolean;
  userId: string;
}

export default function GameStatus({ session, isHost, userId }: Props) {
  const isPlayerTurn =
    (session.current_round % 2 === 1 && session.host_id === userId) ||
    (session.current_round % 2 === 0 && session.guest_id === userId);
  const role = isPlayerTurn ? "Customer" : "Seller";
  const [customerRole, setCustomerRole] = useState<string>("");
  const [product, setProduct] = useState<{ word1: string; word2: string } | null>(null);

  useEffect(() => {
    const fetchCustomerRole = async () => {
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
          .single();

        if (!error && data && data.roles) {
          setCustomerRole(data.roles.name);
          if (data.word1 && data.word2) {
            setProduct({
              word1: data.word1.word,
              word2: data.word2.word
            });
          }
        }
      }
    };

    fetchCustomerRole();
  }, [session.id, session.status, session.host_ready, session.guest_ready]);

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
          current_round: session.current_round + 1,
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
          current_round: session.current_round + 1,
          host_ready: false,
          guest_ready: false
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error rejecting pitch:", error);
    }
  };

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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAccept(session.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Accept Pitch
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReject(session.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
