import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  sessionId: string;
  userId: string;
}

export default function ChatBox({ sessionId, userId }: Props) {
  const [messages, setMessages] = useState<
    {
      content: string;
      created_at: string | null;
      id: string;
      session_id: string;
      user_id: string;
    }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("game_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(data);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_messages" },
        (payload) => {
          if (payload.new.session_id === sessionId) {
            setMessages((prev) => [
              ...prev,
              payload.new as {
                content: string;
                created_at: string | null;
                id: string;
                session_id: string;
                user_id: string;
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase.from("game_messages").insert([
      {
        session_id: sessionId,
        user_id: userId,
        content: newMessage.trim(),
      },
    ]);

    setNewMessage("");
  };

  return (
    <div className="mt-6">
      <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.user_id === userId ? "text-right" : "text-left"
            } mb-2`}
          >
            <p className="text-sm text-gray-500">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border bg-transparent rounded-lg px-4 py-2"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
