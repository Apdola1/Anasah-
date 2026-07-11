// واجهة لعبة الإمبوستر — متعددة اللاعبين (٣+)
import {
  MIN_TO_START, activeSeats, startGame, startVoting, castVote, resetGame,
  topVoted, whoVotedFor,
} from './logic'
import './impostor.css'

export default function ImpostorGame({ state, seat, players, commit, code }) {
  const seats = Object.keys(players).map(Number).sort((a, b) => a - b)
  const nameOf = (s) => players[s]?.name || `لاعب ${s + 1}`
  const isHost = seat === 0

  const ctx = { state, seat, seats, nameOf, isHost, commit, code }

  switch (state.phase) {
    case 'reveal': return <Reveal {...ctx} />
    case 'voting': return <Voting {...ctx} />
    case 'results': return <Results {...ctx} />
    default: return <Lobby {...ctx} />
  }
}

function Lobby({ seat, seats, nameOf, isHost, commit, code }) {
  const enough = seats.length >= MIN_TO_START
  const start = () => commit((s, room) => startGame(s, activeSeats(room)))
  return (
    <div className="imp">
      <div className="imp-emoji-big">🥷</div>
      <h2 className="imp-title">الإمبوستر</h2>
      <div className="imp-share">
        شارك الكود مع صحبك:
        <div className="room-code">{code}</div>
      </div>
      <PlayerChips seats={seats} nameOf={nameOf} seat={seat} />
      <div className="imp-note">{seats.length} لاعبين — نحتاج {MIN_TO_START} على الأقل</div>
      {isHost ? (
        <button className="btn btn-primary" disabled={!enough} onClick={start}>ابدأ اللعبة</button>
      ) : (
        <div className="notice">بانتظار بدء المضيف… ⏳</div>
      )}
    </div>
  )
}

function Reveal({ state, seat, seats, nameOf, isHost, commit }) {
  const amImpostor = seat === state.impostorSeat
  const isSpectator = seat === null
  const startVote = () => commit((s) => startVoting(s))

  return (
    <div className="imp">
      {isSpectator ? (
        <div className="imp-role"><div className="imp-role-emoji">👀</div><div className="imp-role-title">أنت متفرّج</div></div>
      ) : amImpostor ? (
        <div className="imp-role impostor">
          <div className="imp-role-emoji">🥷</div>
          <div className="imp-role-title">أنت الإمبوستر</div>
          <div className="imp-hint">تلميح: {state.topic.hint}</div>
          <div className="imp-role-note">اندمج مع الجماعة… ولا ينكشف!</div>
        </div>
      ) : (
        <div className="imp-role crew">
          <div className="imp-role-label">الموضوع</div>
          <div className="imp-word">{state.topic.word}</div>
          <div className="imp-role-note">اوصفه بذكاء… لا تفضح الكلمة مباشرة!</div>
        </div>
      )}

      <PlayerChips seats={seats} nameOf={nameOf} seat={seat} />
      {isHost ? (
        <button className="btn btn-primary" onClick={startVote}>ابدأ التصويت 🗳️</button>
      ) : (
        <div className="notice">ناقشوا… ثم يبدأ المضيف التصويت</div>
      )}
    </div>
  )
}

function Voting({ state, seat, seats, nameOf, isHost, commit }) {
  const myVote = seat !== null ? state.votes[seat] : undefined
  const votedCount = Object.keys(state.votes).length
  const vote = (target) => commit((s, room) => castVote(s, seat, target, activeSeats(room)))
  const endVoting = () => commit((s) => ({ ...s, phase: 'results' }))

  return (
    <div className="imp">
      <h2 className="imp-title">مين الإمبوستر؟ 🗳️</h2>
      <div className="imp-note">صوّت على اللي تشك فيه</div>
      <div className="imp-vote-list">
        {seats.filter((s) => s !== seat).map((s) => (
          <button
            key={s}
            className={`imp-vote${myVote === s ? ' chosen' : ''}`}
            disabled={myVote !== undefined || seat === null}
            onClick={() => vote(s)}
          >
            {nameOf(s)}
          </button>
        ))}
      </div>
      <div className="imp-note">صوّت {votedCount}/{seats.length}</div>
      {isHost && (
        <button className="btn" onClick={endVoting}>أنهِ التصويت الآن</button>
      )}
    </div>
  )
}

function Results({ state, seat, seats, nameOf, isHost, commit }) {
  const top = topVoted(state.votes)
  const caught = top.length === 1 && top[0] === state.impostorSeat
  const voters = whoVotedFor(state.votes, state.impostorSeat)
  const reset = () => commit(() => resetGame())

  return (
    <div className="imp">
      <div className={`imp-verdict ${caught ? 'good' : 'bad'}`}>
        {caught ? 'انقبض الإمبوستر! 🎉' : 'الإمبوستر فلت! 🥷💨'}
      </div>

      <div className="imp-role impostor">
        <div className="imp-role-emoji">🥷</div>
        <div className="imp-role-title">الإمبوستر كان: {nameOf(state.impostorSeat)}</div>
        <div className="imp-hint">الموضوع كان: «{state.topic.word}»</div>
      </div>

      <div className="imp-section">
        <div className="imp-section-title">اللي صوّتوا عليه:</div>
        {voters.length ? (
          <PlayerChips seats={voters} nameOf={nameOf} seat={seat} />
        ) : (
          <span className="muted">ما صوّت عليه أحد 😅</span>
        )}
      </div>

      <div className="imp-section">
        <div className="imp-section-title">كل الأصوات:</div>
        {seats.map((s) => (
          <div key={s} className="imp-vote-row">
            <b>{nameOf(s)}</b>
            <span className="muted"> صوّت لـ </span>
            {state.votes[s] !== undefined ? nameOf(state.votes[s]) : '—'}
          </div>
        ))}
      </div>

      {isHost && <button className="btn btn-primary" onClick={reset}>لعبة جديدة 🔁</button>}
    </div>
  )
}

function PlayerChips({ seats, nameOf, seat }) {
  return (
    <div className="imp-players">
      {seats.map((s) => (
        <span key={s} className="imp-chip">
          {nameOf(s)}{s === seat ? ' (أنت)' : ''}
        </span>
      ))}
    </div>
  )
}
