// صفحة النمط الفردي — تعرض SoloComponent للعبة بدون غرفة أو تسجيل دخول
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGame } from '../games/registry'
import { track } from '../firebase'

export default function SoloPage() {
  const { gameId } = useParams()
  const game = getGame(gameId)

  useEffect(() => {
    if (game?.SoloComponent) track('solo_started', { game: gameId })
  }, [gameId, game])

  if (!game || !game.SoloComponent) {
    return (
      <div className="page center">
        <div className="notice">النمط الفردي غير متاح لهذه اللعبة.</div>
        <div style={{ marginTop: 16 }}>
          <Link to="/" className="btn">رجوع للألعاب</Link>
        </div>
      </div>
    )
  }

  const Solo = game.SoloComponent
  return (
    <div className="page">
      <Link to={`/g/${gameId}`} className="back-link">← خروج</Link>
      <Solo />
    </div>
  )
}
