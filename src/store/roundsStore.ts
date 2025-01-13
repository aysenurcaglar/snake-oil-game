import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { devtools } from 'zustand/middleware';

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
  error: string | null;

  customerRole: string;
  product: { word1: string; word2: string } | null;
  
  // Actions
  fetchRoles: () => Promise<void>;
  selectRole: (roleId: string, userId: string, sessionId: string) => Promise<void>;
  fetchWords: () => Promise<void>;
  selectWord: (wordId: string) => void;
  confirmWords: (userId: string, sessionId: string) => Promise<void>;
  listenForCustomerReady: (sessionId: string) => void;
  cleanup: () => void;

  fetchRoundData: (sessionId: string) => Promise<void>;
  subscribeToRoundChanges: (sessionId: string) => void;
  handleAccept: (sessionId: string) => Promise<void>;
  handleReject: (sessionId: string) => Promise<void>;
  incrementCurrentRound: (sessionId: string) => Promise<number>;
}

export const useRoundsStore = create<RoundsStore>()(
  devtools((set, get) => ({
  roles: [],
  words: [],
  selectedRole: null,
  selectedWords: [],
  isConfirmed: false,
  customerReady: false,
  channel: null,
  error: null,
  customerRole: "",
  product: null,

    // Fetch roles from the database
    fetchRoles: async () => {
      try {
        const { data, error } = await supabase.rpc("fetch_random_roles", {
          limit_count: 2,
        });
        if (error) throw error;
        set({ roles: data });
      } catch (error) {
        console.error("Error fetching random roles:", error);
        set({ error: "Failed to fetch roles." });
      }
    },
  
    // Handle role selection
    selectRole: async (roleId, userId, sessionId) => {
      try {
        set({ selectedRole: roleId });
        const { error } = await supabase.from("rounds").insert([
          {
            session_id: sessionId,
            customer_id: userId,
            selected_role_id: roleId,
            seller_id: userId,
          },
        ]);
        if (error) throw error;
      } catch (error) {
        console.error("Error selecting role:", error);
        set({ error: "Failed to select role." });
      }
    },
  
    // Fetch words from the database
    fetchWords: async () => {
      try {
        const { data, error } = await supabase.rpc("fetch_random_words", {
          limit_count: 6,
        });
        if (error) throw error;
        set({ words: data });
      } catch (error) {
        console.error("Error fetching random words:", error);
        set({ error: "Failed to fetch words." });
      }
    },
  
    // Handle word selection
    selectWord: (wordId) => {
      const { selectedWords, isConfirmed } = get();
      if (isConfirmed) return;
  
      if (selectedWords.includes(wordId)) {
        set({
          selectedWords: selectedWords.filter((id) => id !== wordId),
        });
      } else if (selectedWords.length < 2) {
        set({
          selectedWords: [...selectedWords, wordId],
        });
      }
    },
  
    // Confirm selected words
    confirmWords: async (userId, sessionId) => {
      try {
        const { selectedWords } = get();
  
        // Get the current round for this session
        const { data: roundData, error: roundError } = await supabase
          .from("rounds")
          .select("id")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (roundError) throw roundError;
  
        // Update the round with the selected words
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
        console.error("Error confirming words:", error);
        set({ error: "Failed to confirm words." });
      }
    },
  
    // Listen for customer readiness
    listenForCustomerReady: (sessionId) => {
      const { channel } = get();
      if (channel) return; // Avoid multiple subscriptions
  
      const newChannel = supabase
        .channel(`session_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rounds",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.new && payload.new.selected_role_id) {
              set({ customerReady: true });
            }
          }
        )
        .subscribe();
  
      set({ channel: newChannel });
    }, 

    // Fetch current round data
    fetchRoundData: async (sessionId) => {
      try {
        const { data, error } = await supabase
          .from("rounds")
          .select(
            `
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
          `
          )
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data[0]) {
          set({
            customerRole: data[0].roles?.name ?? "",
            product: {
              word1: data[0].word1?.word ?? "",
              word2: data[0].word2?.word ?? "",
            },
          });
          console.log("Updated customerRole:", get().customerRole);
          console.log("Updated product:", get().product);
        }
      } catch (error) {
        console.error("Failed to fetch round data:", error);
        set({ error: "Failed to fetch round data." });
      }
    },

    // Subscribe to changes in the rounds table
    subscribeToRoundChanges: (sessionId) => {
      const existingChannel = get().channel;
      if (existingChannel) {
        existingChannel.unsubscribe();
      }
    
      const newChannel = supabase
        .channel(`rounds-channel-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rounds",
            filter: `session_id=eq.${sessionId}`,
          },
          async () => {
            // Only fetch if conditions are met
            const { data } = await supabase
              .from("game_sessions")
              .select("status, host_ready, guest_ready")
              .eq("id", sessionId)
              .single();
            
            if (data?.status === "in_progress" && data.host_ready && data.guest_ready) {
              await get().fetchRoundData(sessionId);
            }
          }
        )
        .subscribe();
    
      set({ channel: newChannel });
    },

    

     // Implement the `incrementCurrentRound` method
     incrementCurrentRound: async (sessionId) => {
      try {
        // Fetch the current round number
        const { data, error } = await supabase
          .from("game_sessions")
          .select("current_round")
          .eq("id", sessionId)
          .single();

        if (error) {
          console.error("Error fetching current round:", error);
          return 1; // Default to 1 if there's an error
        }

        // Increment the round number
        const newRoundNumber = (data.current_round || 0) + 1;
        return newRoundNumber;
      } catch (error) {
        console.error("Unexpected error incrementing current round:", error);
        return 1; // Default to 1 in case of unexpected errors
      }
    },

    // Update `handleAccept` and `handleReject` to await `incrementCurrentRound`
    handleAccept: async (sessionId) => {
      try {
        // Update the rounds table
        await supabase
          .from("rounds")
          .update({ accepted: true })
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get the new round number
        const newRoundNumber = await get().incrementCurrentRound(sessionId);

        // Update the game_sessions table
        await supabase
          .from("game_sessions")
          .update({
            current_round: newRoundNumber,
            host_ready: false,
            guest_ready: false,
          })
          .eq("id", sessionId);
      } catch (error) {
        console.error("Error accepting pitch:", error);
        set({ error: "Error accepting pitch." });
      }
    },

    handleReject: async (sessionId) => {
      try {
        // Update the rounds table
        await supabase
          .from("rounds")
          .update({ accepted: false })
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get the new round number
        const newRoundNumber = await get().incrementCurrentRound(sessionId);

        // Update the game_sessions table
        await supabase
          .from("game_sessions")
          .update({
            current_round: newRoundNumber,
            host_ready: false,
            guest_ready: false,
          })
          .eq("id", sessionId);
      } catch (error) {
        console.error("Error rejecting pitch:", error);
        set({ error: "Error rejecting pitch." });
      }
    },
    // Cleanup on component unmount
    cleanup: () => {
      const { channel } = get();
      if (channel) {
        channel.unsubscribe();
        set({ channel: null });
      }
      // Reset state
      set({
        roles: [],
        words: [],
        selectedRole: null,
        selectedWords: [],
        isConfirmed: false,
        customerReady: false,
        error: null,
        customerRole: "",
        product: null,
      });
    }, 
}))

);