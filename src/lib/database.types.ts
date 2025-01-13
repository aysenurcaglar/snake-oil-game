export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string | null
          current_round: number | null
          guest_id: string | null
          guest_ready: boolean | null
          host_id: string
          host_ready: boolean | null
          id: string
          status: Database["public"]["Enums"]["game_status"] | null
        }
        Insert: {
          created_at?: string | null
          current_round?: number | null
          guest_id?: string | null
          guest_ready?: boolean | null
          host_id: string
          host_ready?: boolean | null
          id?: string
          status?: Database["public"]["Enums"]["game_status"] | null
        }
        Update: {
          created_at?: string | null
          current_round?: number | { increment: number } | null;
          guest_id?: string | null
          guest_ready?: boolean | null
          host_id?: string
          host_ready?: boolean | null
          id?: string
          status?: Database["public"]["Enums"]["game_status"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
        }
        Insert: {
          id: string
          username?: string | null
        }
        Update: {
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          customer_id: string
          id: string
          selected_role_id: string | null
          seller_id: string
          session_id: string
          word1_id: string | null
          word2_id: string | null
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          customer_id: string
          id?: string
          selected_role_id?: string | null
          seller_id: string
          session_id: string
          word1_id?: string | null
          word2_id?: string | null
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          customer_id?: string
          id?: string
          selected_role_id?: string | null
          seller_id?: string
          session_id?: string
          word1_id?: string | null
          word2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_selected_role_id_fkey"
            columns: ["selected_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_word1_id_fkey"
            columns: ["word1_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_word2_id_fkey"
            columns: ["word2_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          created_at: string | null
          id: string
          word: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          word: string
        }
        Update: {
          created_at?: string | null
          id?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fetch_random_roles: {
        Args: {
          limit_count: number
        }
        Returns: {
          id: string
          name: string
          created_at: string
        }[]
      }
      fetch_random_words: {
        Args: {
          limit_count: number
        }
        Returns: {
          id: string
          word: string
          created_at: string
        }[]
      }
    }
    Enums: {
      game_status: "waiting" | "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
