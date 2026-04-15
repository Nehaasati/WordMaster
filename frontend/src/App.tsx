//import React from 'react' (It is causing errors, -Oskar)
import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/Landingpage'
import GamePage from '../pages/GamePage'
import LobbyPage from '../pages/LobbyPage'
import ClassicGamePage from '../games/classic/ClassicGamePage'
import ResultPage from '../pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/game/:lobbyId" element={<GamePage />} />
      <Route path="/classic-game" element={<ClassicGamePage />} />
      <Route path="/result/:lobbyId" element={<ResultPage />} />
    </Routes>
  );
}
export default App;

