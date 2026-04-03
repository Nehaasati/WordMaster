import React, { useState } from 'react'
import LandingPage from '../pages/Landingpage'
import GamePage from '../pages/GamePage'

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'game'>('landing')

  if (currentPage === 'game') {
    return <GamePage />
  }

  return <LandingPage onDev={() => setCurrentPage('game')} />
}

export default App

