import { useNavigate } from 'react-router-dom'
import { games, comingSoon } from '../games/registry'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <section className="hero">
        <h1>أنَـــاســـة</h1>
        <p>اختر لعبة، سوّ غرفة، و ارسل الكود</p>
      </section>

      <h2 className="section-title">الألعاب</h2>
      <div className="games-grid">
        {games.map((g) => (
          <div
            key={g.id}
            className="game-card playable"
            onClick={() => navigate(`/g/${g.id}`)}
          >
            <div>
              <div className="emoji" style={{ background: g.color }}>{g.emoji}</div>
              <h3>{g.name}</h3>
              <div className="tag">{g.tagline}</div>
            </div>
          </div>
        ))}

        {comingSoon.map((g) => (
          <div key={g.id} className="game-card soon">
            <span className="badge-soon">قريباً</span>
            <div>
              <div className="emoji" style={{ background: g.color }}>{g.emoji}</div>
              <h3>{g.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
