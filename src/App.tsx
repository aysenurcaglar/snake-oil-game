import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Auth from "./pages/Auth";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-bl from-blue-400 via-green-400 to-purple-400">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
