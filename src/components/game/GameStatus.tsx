import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ChatBox from "./ChatBox";
import { toast } from 'react-toastify';

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

        if (!error && data) {
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

      // Show toast to all players
      toast.success("🎉 The seller's pitch was accepted! Moving to next round...", {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      console.error("Error accepting pitch:", error);
      toast.error("Failed to process the pitch acceptance");
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

      // Show toast to all players
      toast.info("❌ The seller's pitch was rejected. Moving to next round...", {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      console.error("Error rejecting pitch:", error);
      toast.error("Failed to process the pitch rejection");
    }
  };

  if (session.status === "waiting") {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Waiting for opponent...</h2>
        <p className="text-white">
          Share the Game ID with your friend to start playing!
        </p>
      </div>
    );
  }

  if (session.status === "in_progress") {
    if (!session.host_ready || !session.guest_ready) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Preparing for Round {session.current_round}
          </h2>
          <p className="text-lg text-white mb-4">
            {isHost
              ? `You are the ${
                  session.current_round % 2 === 1 ? "Customer" : "Seller"
                }`
              : `You are the ${
                  session.current_round % 2 === 0 ? "Customer" : "Seller"
                }`}
          </p>
        </div>
      );
    }

    if (
      session.status === "in_progress" &&
      session.host_ready &&
      session.guest_ready
    ) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Round {session.current_round}
          </h2>
          <div className="flex items-center justify-between text-lg text-white space-y-2 mb-4">
            <p>Customer's Role: <span className="font-semibold">{customerRole}</span></p>
            <p>Product: <span className="font-semibold">{product ? `${product.word1} ${product.word2}` : ''}</span></p>
          </div>

          <ChatBox sessionId={session.id} userId={userId} />

          {role === "Customer" && (
            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={() => handleAccept(session.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Accept Pitch
              </button>
              <button
                onClick={() => handleReject(session.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Pitch
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Round {session.current_round}
        </h2>
        <p className="text-lg text-white mb-4">
          You are the <span className="font-semibold">{role}</span>
        </p>
        {isPlayerTurn ? (
          <p className="text-white">It's your turn!</p>
        ) : (
          <p className="text-white">Waiting for the other player...</p>
        )}
      </div>
    );
  }

  return null;
}
