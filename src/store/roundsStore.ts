import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Role {
  id: string;
  name: string;
}

interface Word {
  id: string;
  word: string;
}

interface RoundsStore {
  roles: Role[];
  words: Word[];
  selectedRole: string | null;
  selectedWords: string[];
  isConfirmed: boolean;
  customerReady: boolean;
  channel: RealtimeChannel | null;
  
  // Role management
  fetchRandomRoles: () => Promise<void>;
  selectRole: (sessionId: string, userId: string, roleId: string) => Promise<void>;
  
  // Word management
  fetchRandomWords: () => Promise<void>;
  toggleWordSelection: (wordId: string) => void;
  confirmWordSelection: (sessionId: string) => Promise<void>;
  
  // Round management
  subscribeToRounds: (sessionId: string) => void;
  unsubscribeFromRounds: () => void;
  
  // State management
  reset: () => void;
}

export const useRoundsStore = create<RoundsStore>((set, get) => ({
  roles: [],
  words: [],
  selectedRole: null,
  selectedWords: [],
  isConfirmed: false,
  customerReady: false,
  channel: null,

  fetchRandomRoles: async () => {
    try {
      const { data, error } = await supabase.rpc("fetch_random_roles", {
        limit_count: 2,
      });

      if (error) throw error;
      set({ roles: data || [] });
    } catch (error) {
      console.error("Error fetching random roles:", error);
    }
  },

  selectRole: async (sessionId: string, userId: string, roleId: string) => {
    try {
      await supabase.from("rounds").insert([
        {
          session_id: sessionId,
          customer_id: userId,
          seller_id: userId,
          selected_role_id: roleId,
        },
      ]);
      set({ selectedRole: roleId });
    } catch (error) {
      console.error("Error selecting role:", error);
    }
  },

  fetchRandomWords: async () => {
    try {
      const { data, error } = await supabase.rpc("fetch_random_words", {
        limit_count: 6,
      });

      if (error) throw error;
      set({ words: data || [] });
    } catch (error) {
      console.error("Error fetching random words:", error);
    }
  },

  toggleWordSelection: (wordId: string) => {
    set((state) => {
      const currentSelected = state.selectedWords;
      if (currentSelected.includes(wordId)) {
        return { selectedWords: currentSelected.filter((id) => id !== wordId) };
      } else if (currentSelected.length < 2) {
        return { selectedWords: [...currentSelected, wordId] };
      }
      return state;
    });
  },

  confirmWordSelection: async (sessionId: string) => {
    const { selectedWords } = get();
    if (selectedWords.length !== 2) return;

    try {
      const { data: roundData, error: roundError } = await supabase
        .from("rounds")
        .select("id")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (roundError) throw roundError;

      const { error } = await supabase
        .from("rounds")
        .update({
          word1_id: selectedWords[0],
          word2_id: selectedWords[1],
        })
        .eq("id", roundData.id);

      if (error) throw error;
      set({ isConfirmed: true });
    } catch (error) {
      console.error("Error confirming word selection:", error);
    }
  },

  subscribeToRounds: (sessionId: string) => {
    const channel = supabase
      .channel(`rounds_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rounds",
        },
        (payload) => {
          if (payload.new && payload.new.selected_role_id) {
            set({ customerReady: true });
          }
        }
      )
      .subscribe();

    set({ channel });
  },

  unsubscribeFromRounds: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  reset: () => {
    set({
      roles: [],
      words: [],
      selectedRole: null,
      selectedWords: [],
      isConfirmed: false,
      customerReady: false,
      channel: null,
    });
  },
}));