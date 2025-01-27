import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, SquarePen, X, Check, Menu } from "lucide-react";
import { supabase } from "../lib/supabase";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(
    user?.user_metadata?.username || ""
  );
  const [error, setError] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username: newUsername },
      });

      if (metadataError) throw metadataError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      setError("");

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
    <>
      <div className="navbar max-w-4xl mx-auto px-4 py-8 text-white">
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
            <h1 className="text-2xl md:text-4xl font-bold">Snake Oil</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center hidden md:flex">
          <Link
            to="/about"
            className="btn btn-ghost normal-case text-lg md:text-xl"
          >
            About
          </Link>
        </div>

        <div className="navbar-end">
          {user && (
            <div className="hidden md:flex items-center gap-2 ml-4">
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
                    <span className="text-lg md:text-xl mr-2">
                      {user?.user_metadata?.username || "Anonymous"}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-ghost btn-square btn-sm"
                    >
                      <SquarePen className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="btn btn-ghost btn-square btn-sm"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="btn btn-ghost btn-square md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu - Slides from right */}
      <div
        className={`fixed top-0 right-0 h-full w-60 bg-gradient-to-br from-green-400 to-blue-400 transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4">
          <button
            className="btn btn-ghost btn-square float-right"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mt-16">
            <Link
              to="/about"
              className="block py-3 px-4 hover:bg-base-300 rounded-lg text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>

            {user && (
              <>
                <div className="divider"></div>
                <div className="p-4">
                  <div className="mb-4">
                    <span className="text-lg block mb-2">
                      {user?.user_metadata?.username || "Anonymous"}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-ghost btn-sm"
                    >
                      <SquarePen className="w-4 h-4 mr-2" />
                      Edit Username
                    </button>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-sm w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-glass z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {error && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
