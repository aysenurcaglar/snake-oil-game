import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface GameStore {
  sessionId: string | null;
  isHost: boolean;
  setSessionId: (id: string) => void;
  setIsHost: (isHost: boolean) => void;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set) => ({
  sessionId: null,
  isHost: false,
  setSessionId: (id) => set({ sessionId: id }),
  setIsHost: (isHost) => set({ isHost }),
  leaveSession: async (sessionId, userId) => {
    const { data: session } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (session) {
      if (session.host_id === userId) {
        // If the host is leaving, end the game
        await supabase
          .from('game_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      } else if (session.guest_id === userId) {
        // If the guest is leaving, remove them from the session
        await supabase
          .from('game_sessions')
          .update({ guest_id: null, status: 'waiting' })
          .eq('id', sessionId);
      }
    }

    set({ sessionId: null, isHost: false });
  },
}));

