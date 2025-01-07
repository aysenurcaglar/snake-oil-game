import React from "react";
import { supabase } from "../../lib/supabase";
import ChatBox from "./ChatBox";

interface Props {
  session: any;
  isHost: boolean;
  userId: string;
}

export default function GameStatus({ session, isHost, userId }: Props) {
  const handleReady = async () => {
    const field = isHost ? "host_ready" : "guest_ready";
    await supabase
      .from("game_sessions")
      .update({ [field]: true })
      .eq("id", session.id);
  };

  const isPlayerTurn =
    (session.current_round % 2 === 1 && session.host_id === userId) ||
    (session.current_round % 2 === 0 && session.guest_id === userId);
  const role = isPlayerTurn ? "Customer" : "Seller";

  const handleAccept = async (sessionId: string) => {
    try {
      await supabase
        .from("rounds")
        .update({ accepted: true })
        .eq("session_id", sessionId);
    } catch (error) {
      console.error("Error accepting pitch:", error);
    }
  };

  const handleReject = async (sessionId: string) => {
    try {
      await supabase
        .from("rounds")
        .update({ accepted: false })
        .eq("session_id", sessionId);
    } catch (error) {
      console.error("Error rejecting pitch:", error);
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
          <button
            onClick={handleReady}
            disabled={
              (isHost && session.host_ready) || (!isHost && session.guest_ready)
            }
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {(isHost && session.host_ready) || (!isHost && session.guest_ready)
              ? "Ready!"
              : "Mark as Ready"}
          </button>
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
          <p className="text-lg text-white mb-4">
            Product:{" "}
            <span className="font-semibold">
              {session.word1} {session.word2}
            </span>
          </p>

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
