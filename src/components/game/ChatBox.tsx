import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  sessionId: string;
  userId: string;
}

interface GameSession {
  host_id: string;
  guest_id: string;
}

export default function ChatBox({ sessionId, userId }: Props) {
  const [messages, setMessages] = useState<{
    content: string;
    created_at: string | null;
    id: string;
    session_id: string;
    user_id: string;
  }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const fetchSessionAndUsernames = async () => {
      // First fetch game session to get player IDs
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .select("host_id, guest_id")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData) {
        console.error("Error fetching session:", sessionError);
        return;
      }

      // Fetch usernames for both players from profiles
      const playerIds = [sessionData.host_id, sessionData.guest_id].filter(Boolean);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', playerIds);

      if (!profilesError && profiles) {
        const usernameMap: Record<string, string> = {};
        profiles.forEach(profile => {
          usernameMap[profile.id] = profile.username || 'Unknown Player';
        });
        setUsernames(usernameMap);
      }
    };

    fetchSessionAndUsernames();
  }, [sessionId]);

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
            setMessages((prev) => [...prev, payload.new as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDisplayName = (id: string) => {
    return usernames[id] || "Unknown Player";
  };

  return (
    <div className="mt-6">
      <motion.div
        ref={chatContainerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-auto"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.user_id === userId ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`${
                msg.user_id === userId
                  ? "text-right justify-self-end"
                  : "text-left justify-self-start"
              } mb-2 border border-white rounded-full py-2 px-4 w-1/2 md:w-1/3 ${
                msg.user_id === userId ? "ml-auto" : ""
              }`}
            >
              <p className="font-bold">{getDisplayName(msg.user_id)}</p>
              <p className="text-sm text-white">{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 flex"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-grow border bg-transparent rounded-lg px-4 py-2"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Send
        </motion.button>
      </motion.div>
    </div>
  );
}