import { useState, useEffect } from "react";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add effect to close drawer on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // 768px is the md breakpoint
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setIsDrawerOpen(false);
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

  const UsernameEditor = () => (
    <div className="relative">
      {isEditing ? (
        <div className="flex items-center">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="input input-bordered input-primary bg-transparent w-full max-w-xs h-8"
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
          <span className="text-lg ml-4">
            {user?.user_metadata?.username || "Anonymous"}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost btn-square btn-sm"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="drawer drawer-end">
      <input
        id="drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={(e) => setIsDrawerOpen(e.target.checked)}
      />

      <div className="drawer-content">
        {/* Main Navbar Content */}
        <div className="navbar max-w-4xl mx-auto px-4 text-white">
          <div className="flex-1">
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

          {/* Navigation Items (visible on all screens) */}
          <Link to="/about" className="btn btn-ghost normal-case text-lg">
            About
          </Link>

          {/* Desktop User Controls */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <UsernameEditor />
                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost text-lg"
                >
                  Logout
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button (only for user controls) */}
          {user && (
            <div className="md:hidden">
              <label
                htmlFor="drawer"
                className="btn btn-ghost btn-square drawer-button"
              >
                <Menu className="w-6 h-6" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Side Content (only for user controls) */}
      <div className="drawer-side">
        <label htmlFor="drawer" className="drawer-overlay"></label>
        <div className="menu p-4 w-72 min-h-full bg-glass text-white">
          <div className="flex flex-col gap-4 pt-8">
            {user && (
              <div className="flex flex-col gap-4">
                <UsernameEditor />
                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost text-lg justify-start"
                >
                  Logout
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
