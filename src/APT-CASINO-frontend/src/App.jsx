import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Providers from "./providers/Providers";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import BrowserCheck from "./components/BrowserCheck";
// App directory routes (Next.js style converted to React)
import HomePage from "./app/page";
import GameLobbyPage from "./app/game/page";
import BankPageApp from "./app/bank/page";
import RouletteGame from "./app/game/roulette/page.jsx";

// Enhanced backend-integrated components
import EnhancedRouletteGame from "./components/games/EnhancedRouletteGame.jsx";
import Mines from "./app/game/mines/page";
import WheelGame from "./app/game/wheel/page";

function App() {
  return (
    <BrowserCheck>
      <Router>
        <div className="overflow-x-hidden w-full">
          <Providers>
            <Navbar />
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<GameLobbyPage />} />
              <Route path="/bank" element={<BankPageApp />} />

              {/* Enhanced backend-integrated game routes */}
              <Route path="/game/roulette" element={<RouletteGame />} />

              <Route
                path="/game/roulette-enhanced"
                element={<EnhancedRouletteGame />}
              />

              <Route path="/game/mines" element={<Mines />} />
              <Route path="/game/wheel" element={<WheelGame />} />
            </Routes>
            <Footer />
          </Providers>
        </div>
      </Router>
    </BrowserCheck>
  );
}

export default App;
