import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGame } from '../games/registry'
import { useAuth } from '../lib/auth'
import { getSavedName, saveName } from '../lib/auth'
import { createRoom, joinRoom } from '../lib/rooms'
import { isFirebaseConfigured, track } from '../firebase'

export default function GameLobby() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const game = getGame(gameId)

  const [name, setName] = useState(getSavedName())
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!game) {
    return (
      <div className="page center">
        <p className="muted">هذه اللعبة مو موجودة بعد.</p>
        <Link to="/" className="btn">رجوع للألعاب</Link>
      </div>
    )
  }

  const ready = user && !loading

  async function handleCreate() {
    setError('')
    if (!name.trim()) return setError('اكتب اسمك أول 🙂')
    saveName(name.trim())
    setBusy(true)
    try {
      const roomCode = await createRoom(gameId, user.uid, name.trim())
      track('room_created', { game: gameId })
      navigate(`/g/${gameId}/${roomCode}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  async function handleJoin() {
    setError('')
    if (!name.trim()) return setError('اكتب اسمك أول 🙂')
    if (code.trim().length < 4) return setError('الكود ٤ حروف')
    saveName(name.trim())
    setBusy(true)
    try {
      const roomCode = code.trim().toUpperCase()
      // نوجّه للّعبة الفعلية للغرفة، مو بالضرورة لعبة هذا اللوبي (الكود موحّد)
      const { gameId: roomGameId } = await joinRoom(roomCode, user.uid, name.trim())
      track('room_joined', { game: roomGameId })
      navigate(`/g/${roomGameId}/${roomCode}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">← كل الألعاب</Link>
      <div className="card-panel stack">
        <div className="center">
          <div className="emoji" style={{ background: game.color, margin: '0 auto 6px', fontSize: 40, width: 60, height: 60, display: 'grid', placeItems: 'center', borderRadius: 16 }}>{game.emoji}</div>
          <h2>{game.name}</h2>
        </div>

        {game.howTo && <HowToPlay steps={game.howTo} />}

        {!isFirebaseConfigured && (
          <div className="notice error">
            إعدادات Firebase ناقصة — عبّي ملف <code>.env.local</code> عشان يشتغل الأونلاين.
          </div>
        )}

        {game.SoloComponent && (
          <>
            <button className="btn btn-primary" onClick={() => navigate(`/g/${gameId}/solo`)}>
              {game.soloLabel || 'العب منفرد'}
            </button>
            <div className="divider">أو العب مع صاحبك</div>
          </>
        )}

        <input
          className="input"
          style={{ letterSpacing: 'normal', textAlign: 'start' }}
          placeholder="اسمك"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="btn btn-primary" disabled={!ready || busy} onClick={handleCreate}>
          {busy ? '…' : 'أنشئ غرفة جديدة'}
        </button>

        <div className="divider">أو انضم بكود</div>

        <input
          className="input"
          placeholder="- - - -"
          value={code}
          maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button className="btn btn-primary" disabled={!ready || busy} onClick={handleJoin}>
          انضم للغرفة
        </button>

        {error && <div className="notice error">{error}</div>}
      </div>
    </div>
  )
}

// شرح مبسّط لطريقة اللعب — ظاهر افتراضياً وقابل للطيّ
function HowToPlay({ steps }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="howto">
      <button className="howto-toggle" onClick={() => setOpen(!open)}>
        <span>كيف تلعب؟</span>
        <span className="howto-chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ol className="howto-steps">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
