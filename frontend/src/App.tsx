//import React from 'react' (It is causing errors, -Oskar)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/Landingpage'
import GamePage from '../pages/GamePage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Game page with its own URL */}
        <Route path="/game" element={<GamePage />} />

        {/* Future: Unique game links (e.g., /game/ABC-123) */}
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </Router>
  )
}

export default App

