import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import GameLobby from './pages/GameLobby'
import GameRoom from './pages/GameRoom'
import './App.css'

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">أ</span>
          <span className="brand-name">أناسة</span>
        </Link>
        <span className="brand-tag muted">ونس وألعاب</span>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/g/:gameId" element={<GameLobby />} />
          <Route path="/g/:gameId/:code" element={<GameRoom />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  )
}
