import React from "react";
import { supabase } from "../../lib/supabase";

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
    (session.current_round % 2 === 1 && isHost) ||
    (session.current_round % 2 === 0 && !isHost);
  const role = isPlayerTurn ? "Customer" : "Seller";

  if (session.status === "waiting") {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Waiting for opponent...</h2>
        <p className="text-gray-600">
          Share the Game ID with your friend to start playing!
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <h2 className="text-2xl font-semibold mb-2">
        Round {session.current_round}
      </h2>
      <p className="text-lg text-gray-600 mb-4">
        You are the <span className="font-semibold">{role}</span>
      </p>

      {!isHost ? (
        <button
          onClick={handleReady}
          disabled={session.guest_ready}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {session.guest_ready ? "Ready!" : "Mark as Ready"}
        </button>
      ) : (
        <button
          onClick={handleReady}
          disabled={session.host_ready}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {session.host_ready ? "Ready!" : "Mark as Ready"}
        </button>
      )}
    </div>
  );
}
