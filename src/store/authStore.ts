import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  generateUsername: () => Promise<string>;
  ensureUsername: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    set({ user: data.user });
    await get().ensureUsername();
  },
  signUp: async (email, password) => {
    const username = await get().generateUsername();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    if (error) throw error;
    set({ user: data.user });
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  generateUsername: async () => {
    try {
      const response = await fetch('https://usernameapiv1.vercel.app/api/random-usernames');
      const data = await response.json();
      return data.usernames[0];
    } catch (error) {
      console.error("Failed to generate username:", error);
      return "Player" + Math.floor(Math.random() * 10000);
    }
  },
  ensureUsername: async () => {
    const { user } = get();
    if (user && !user.user_metadata.username) {
      const username = await get().generateUsername();
      const { data, error } = await supabase.auth.updateUser({
        data: { username }
      });
      if (error) {
        console.error("Failed to update username:", error);
      } else {
        set({ user: data.user });
      }
    }
  },
}));

