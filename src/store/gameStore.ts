import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface GameStore {
  sessionId: string | null;
  isHost: boolean;
  error: string | null;
  setSessionId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  setError: (error: string | null) => void;
  createGame: (userId: string) => Promise<string | null>;
  joinGame: (gameId: string, userId: string) => Promise<boolean>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set) => ({
  sessionId: null,
  isHost: false,
  error: null,
  setSessionId: (id) => set({ sessionId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setError: (error) => set({ error }),
  
  createGame: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert([
          {
            host_id: userId,
            status: "waiting",
          },
        ])
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

      // Check if game exists and is available
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

      // Update game session
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

      set({ sessionId: null, isHost: false, error: null });
    } catch (error) {
      set({ error: "Failed to leave session. Please try again." });
    }
  },
}));