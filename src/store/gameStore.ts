import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface GameState {
  sessionId: string | null;
  isHost: boolean;
  setSessionId: (id: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  leaveSession: () => Promise<void>;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  isHost: false,
  setSessionId: (id) => set({ sessionId: id }),
  setIsHost: (isHost) => set({ isHost }),
  leaveSession: async () => {
    const { sessionId, isHost } = useGameStore.getState();
    
    if (sessionId) {
      if (isHost) {
        await supabase
          .from('game_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      } else {
        await supabase
          .from('game_sessions')
          .update({ guest_id: null, guest_ready: false })
          .eq('id', sessionId);
      }
    }
    
    set({ sessionId: null, isHost: false });
  },
}));