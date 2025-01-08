import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, SquarePen, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.user_metadata?.username || "");
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    try {
      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });

      if (metadataError) throw metadataError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      setError("");
      
      // Update local user state
      useAuthStore.setState(state => ({
        ...state,
        user: {
          ...state.user,
          user_metadata: {
            ...state.user.user_metadata,
            username: newUsername
          }
        }
      }));
    } catch (err) {
      setError("Failed to update username");
      console.error("Error updating username:", err);
    }
  };

  return (
    <div className="flex items-center justify-between py-8 max-w-4xl mx-auto">
      <div
        className="flex items-center justify-center cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="./snake-3-svgrepo-com.svg"
          alt="Snake"
          className="w-10 h-10 mr-2"
        />
        <h1 className="text-4xl font-bold text-white">Snake Oil</h1>
      </div>
      <div className="flex items-center">
        <Link
          to="/about"
          className="text-white text-xl hover:text-gray-300 transition-colors"
        >
          About
        </Link>
      </div>
      {user && (
        <div className="flex items-center">
          <div className="relative mr-4">
            {isEditing ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-transparent text-white text-xl border-b border-purple-500 focus:outline-none focus:border-purple-600 px-2 py-1 mr-2"
                  autoFocus
                />
                <button
                  onClick={handleUpdateUsername}
                  className="text-green-600 hover:text-green-700 mr-2"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(user?.user_metadata?.username || "");
                    setError("");
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <h3 className="text-white text-xl">
                  Welcome, {user?.user_metadata?.username || user?.email}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-purple-500 hover:text-purple-600"
                >
                  <SquarePen className="w-5 h-5" />
                </button>
              </div>
            )}
            {error && (
              <p className="absolute text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 bg-transparent text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;