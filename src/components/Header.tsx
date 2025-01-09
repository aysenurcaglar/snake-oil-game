import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, SquarePen, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(
    user?.user_metadata?.username || ""
  );
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
        data: { username: newUsername },
      });

      if (metadataError) throw metadataError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      setError("");

      // Update local user state
      useAuthStore.setState((state) => ({
        ...state,
        user: {
          ...state.user,
          user_metadata: {
            ...state.user.user_metadata,
            username: newUsername,
          },
        },
      }));
    } catch (err) {
      setError("Failed to update username");
      console.error("Error updating username:", err);
    }
  };

  return (
    <div className="navbar bg-base-100 max-w-4xl mx-auto px-4">
      <div className="navbar-start">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="./snake-3-svgrepo-com.svg"
            alt="Snake"
            className="w-8 h-8 md:w-10 md:h-10 mr-2"
          />
          <h1 className="text-2xl md:text-4xl font-bold text-primary">
            Snake Oil
          </h1>
        </div>
      </div>

      <div className="navbar-end">
        <Link
          to="/about"
          className="btn btn-ghost text-primary normal-case text-lg md:text-xl"
        >
          About
        </Link>

        {user && (
          <div className="flex items-center gap-2 ml-4">
            <div className="relative">
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="input input-bordered input-primary w-full max-w-xs h-8"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="btn btn-ghost btn-square btn-sm text-success ml-2"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewUsername(user?.user_metadata?.username || "");
                      setError("");
                    }}
                    className="btn btn-ghost btn-square btn-sm text-error"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-primary text-lg md:text-xl mr-2">
                    {user?.user_metadata?.username || "Anonymous"}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-ghost btn-square btn-sm text-primary"
                  >
                    <SquarePen className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              )}
              {error && (
                <div className="toast toast-end">
                  <div className="alert alert-error">
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-square btn-sm text-primary"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
