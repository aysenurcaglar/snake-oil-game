import React from 'react';
import { LogOut } from 'lucide-react';

interface Props {
  sessionId: string;
  onLeave: () => void;
}

export default function GameHeader({ sessionId, onLeave }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">Snake Oil</h1>
        <p className="text-white opacity-75">Game ID: {sessionId}</p>
      </div>
      
      <button
        onClick={onLeave}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Leave Game
      </button>
    </div>
  );
}