import React from "react";
import { LogOut } from "lucide-react";

interface Props {
  onLeave: () => void;
}

export default function GameHeader({ onLeave }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">Snake Oil</h1>
      </div>

      <button
        onClick={onLeave}
        className="inline-flex items-center px-4 py-2 text-purple-500 hover:text-purple-600 border-2 border-purple-500 hover:border-purple-600 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Leave Game
      </button>
    </div>
  );
}
