import { useParams, Link } from 'react-router-dom'
import { getGame } from '../games/registry'
import { useRoom } from '../lib/useRoom'
import { pushState, restartGame } from '../lib/rooms'

export default function GameRoom() {
  const { gameId, code } = useParams()
  const game = getGame(gameId)
  const { room, seat, playersBySeat, error } = useRoom(code)

  if (!game) return <Fallback msg="لعبة غير معروفة" />
  if (error) return <Fallback msg={error} />
  if (room === undefined) return <Fallback msg="نفتح الغرفة…" spinner />
  if (room === null) return <Fallback msg="الغرفة مو موجودة — تأكد من الكود" />

  const filledSeats = room.seats.filter((s) => s !== null).length
  const waiting = filledSeats < game.minPlayers
  const gameOver = room.state?.winner !== undefined && room.state?.winner !== null

  const onMove = (nextState) => pushState(code, nextState)
  const onRestart = () => restartGame(code, gameId)

  return (
    <div className="page">
      <Link to={`/g/${gameId}`} className="back-link">← خروج</Link>

      {/* شريط اللاعبين */}
      <div className="players-bar">
        {Array.from({ length: game.maxPlayers }).map((_, i) => {
          const p = playersBySeat[i]
          const isMe = seat === i
          return (
            <span key={i} className="player-chip">
              <span className={`dot${p ? '' : ' empty'}`} />
              {p ? `${p.name}${isMe ? ' (أنت)' : ''}` : 'بانتظار لاعب…'}
            </span>
          )
        })}
      </div>

      {waiting ? (
        <WaitingRoom code={code} />
      ) : (
        <>
          <game.Component
            state={room.state}
            seat={seat}
            players={playersBySeat}
            onMove={onMove}
          />
          {gameOver && (
            <div className="center" style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={onRestart}>لعبة جديدة 🔁</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WaitingRoom({ code }) {
  const shareLink = `${window.location.origin}${window.location.pathname}`
  function copy() {
    navigator.clipboard?.writeText(shareLink)
  }
  return (
    <div className="card-panel stack center">
      <p className="muted">أرسل الكود لصاحبك عشان يدخل الغرفة:</p>
      <div className="room-code">{code}</div>
      <button className="btn" onClick={copy}>انسخ رابط الدعوة 🔗</button>
      <div className="notice">بانتظار انضمام اللاعب الثاني…</div>
    </div>
  )
}

function Fallback({ msg, spinner }) {
  return (
    <div className="page center">
      <div className="notice">{spinner ? '⏳ ' : ''}{msg}</div>
      <div style={{ marginTop: 16 }}>
        <Link to="/" className="btn">رجوع للألعاب</Link>
      </div>
    </div>
  )
}
