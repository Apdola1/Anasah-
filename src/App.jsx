import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import GameLobby from './pages/GameLobby'
import GameRoom from './pages/GameRoom'
import SoloPage from './pages/SoloPage'
import './App.css'

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffb454" />
                  <stop offset="1" stopColor="#ff6b81" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="92" height="92" rx="26" fill="url(#brandGrad)" />
              <g transform="rotate(-8 50 50)">
                <rect x="30" y="30" width="40" height="40" rx="11" fill="#fff2e0" />
                <circle cx="41" cy="41" r="4.2" fill="#2a1206" />
                <circle cx="59" cy="41" r="4.2" fill="#2a1206" />
                <circle cx="50" cy="50" r="4.2" fill="#2a1206" />
                <circle cx="41" cy="59" r="4.2" fill="#2a1206" />
                <circle cx="59" cy="59" r="4.2" fill="#2a1206" />
              </g>
            </svg>
          </span>
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/g/:gameId" element={<GameLobby />} />
          <Route path="/g/:gameId/solo" element={<SoloPage />} />
          <Route path="/g/:gameId/:code" element={<GameRoom />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  )
}
