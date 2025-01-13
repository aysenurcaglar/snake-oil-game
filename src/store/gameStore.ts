import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { toast } from 'react-toastify';
import { devtools } from 'zustand/middleware';

type GameSession = Database['public']['Tables']['game_sessions']['Row'];

interface GameStore {
  sessionId: string | null;
  isHost: boolean;
  error: string | null;
  gameSession: GameSession | null;
  channel: any | null;
  
  // Basic session management
  setSessionId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  setError: (error: string | null) => void;
  setGameSession: (session: GameSession | null) => void;
  
  // Game creation and joining
  createGame: (userId: string) => Promise<string | null>;
  joinGame: (gameId: string, userId: string) => Promise<boolean>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
  
  // Game session management
  fetchGameSession: (sessionId: string) => Promise<GameSession | null>;
  subscribeToGameSession: (sessionId: string, userId: string, onNavigate: () => void) => void;
  unsubscribeFromGameSession: () => void;
  markReady: (sessionId: string, isHost: boolean) => Promise<void>;
}

export const useGameStore = create<GameStore>()(
  devtools((set, get) => ({
  sessionId: null,
  isHost: false,
  error: null,
  gameSession: null,
  channel: null,

  setSessionId: (id) => set({ sessionId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setError: (error) => set({ error }),
  setGameSession: (session) => set({ gameSession: session }),

  createGame: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert([{ host_id: userId, status: "waiting" }])
        .select()
        .single();

      if (error) throw error;

      set({ sessionId: data.id, isHost: true, error: null });
      return data.id;
    } catch (error) {
      set({ error: "Failed to create game. Please try again." });
      return null;
    }
  },

  joinGame: async (gameId, userId) => {
    try {
      if (!gameId) {
        set({ error: "Please enter a game ID" });
        return false;
      }

      const { data: gameSession } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", gameId)
        .eq("status", "waiting")
        .is("guest_id", null)
        .single();

      if (!gameSession) {
        set({ error: "Invalid game ID or game is not available" });
        return false;
      }

      const { error: updateError } = await supabase
        .from("game_sessions")
        .update({
          guest_id: userId,
          status: "in_progress",
        })
        .eq("id", gameId);

      if (updateError) throw updateError;

      set({ sessionId: gameId, isHost: false, error: null });
      return true;
    } catch (error) {
      set({ error: "Failed to join the game. Please try again." });
      return false;
    }
  },

  leaveSession: async (sessionId, userId) => {
    try {
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (session) {
        if (session.host_id === userId) {
          await supabase
            .from('game_sessions')
            .update({ status: 'completed' })
            .eq('id', sessionId);
        } else if (session.guest_id === userId) {
          await supabase
            .from('game_sessions')
            .update({ guest_id: null, status: 'waiting' })
            .eq('id', sessionId);
        }
      }

      get().unsubscribeFromGameSession();
      set({ sessionId: null, isHost: false, error: null, gameSession: null });
    } catch (error) {
      set({ error: "Failed to leave session. Please try again." });
    }
  },

  fetchGameSession: async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      set({ gameSession: data });
      return data;
    } catch (error) {
      set({ error: "Failed to fetch game session." });
      return null;
    }
  },

  subscribeToGameSession: (sessionId, userId, onNavigate) => {
    const channel = supabase.channel(`game_${sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });

    channel
      // Game session changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "completed") {
            onNavigate();
          } else {
            set((state) => ({
              gameSession: 
                JSON.stringify(state.gameSession) !== JSON.stringify(payload.new)
                  ? payload.new
                  : state.gameSession
            }));
          }
        }
      )
      // Round updates
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `session_id=eq.${sessionId}`,
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
      .subscribe();

    set({ channel });
  },

  unsubscribeFromGameSession: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  markReady: async (sessionId, isHost) => {
    const field = isHost ? "host_ready" : "guest_ready";
    try {
      await supabase
        .from("game_sessions")
        .update({ [field]: true })
        .eq("id", sessionId);
    } catch (error) {
      set({ error: "Failed to mark as ready." });
    }
  },
}))
);