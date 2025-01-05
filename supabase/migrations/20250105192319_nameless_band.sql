/*
  # Snake Oil Game Schema

  1. New Tables
    - `game_sessions`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `host_id` (uuid, references auth.users)
      - `guest_id` (uuid, references auth.users, nullable)
      - `current_round` (int, default 1)
      - `host_ready` (boolean)
      - `guest_ready` (boolean)
      - `status` (enum: 'waiting', 'in_progress', 'completed')
      
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      
    - `words`
      - `id` (uuid, primary key)
      - `word` (text)
      - `created_at` (timestamp)
      
    - `rounds`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references game_sessions)
      - `customer_id` (uuid, references auth.users)
      - `seller_id` (uuid, references auth.users)
      - `selected_role_id` (uuid, references roles)
      - `word1_id` (uuid, references words)
      - `word2_id` (uuid, references words)
      - `accepted` (boolean, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum type for game status
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'completed');

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  host_id uuid REFERENCES auth.users NOT NULL,
  guest_id uuid REFERENCES auth.users,
  current_round int DEFAULT 1,
  host_ready boolean DEFAULT false,
  guest_ready boolean DEFAULT false,
  status game_status DEFAULT 'waiting',
  CONSTRAINT unique_players CHECK (host_id != guest_id)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions NOT NULL,
  customer_id uuid REFERENCES auth.users NOT NULL,
  seller_id uuid REFERENCES auth.users NOT NULL,
  selected_role_id uuid REFERENCES roles,
  word1_id uuid REFERENCES words,
  word2_id uuid REFERENCES words,
  accepted boolean,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Policies for game_sessions
CREATE POLICY "Users can view their own sessions"
  ON game_sessions
  FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can create sessions"
  ON game_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Session participants can update their sessions"
  ON game_sessions
  FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Policies for roles
CREATE POLICY "Everyone can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for words
CREATE POLICY "Everyone can view words"
  ON words
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for rounds
CREATE POLICY "Session participants can view their rounds"
  ON rounds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE id = rounds.session_id
      AND (auth.uid() = host_id OR auth.uid() = guest_id)
    )
  );

CREATE POLICY "Session participants can create rounds"
  ON rounds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE id = rounds.session_id
      AND (auth.uid() = host_id OR auth.uid() = guest_id)
    )
  );

CREATE POLICY "Session participants can update rounds"
  ON rounds
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE id = rounds.session_id
      AND (auth.uid() = host_id OR auth.uid() = guest_id)
    )
  );