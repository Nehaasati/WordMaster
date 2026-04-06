//import React from 'react' (It is causing errors, -Oskar)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/Landingpage'
import GamePage from '../pages/GamePage'
import LobbyPage from '../pages/LobbyPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
        
        {/* Game page with its own URL */}
        <Route path="/game" element={<GamePage />} />
        <Route path="/game/:lobbyId" element={<GamePage />} />
      </Routes>
    </Router>
  )
}

export default App

