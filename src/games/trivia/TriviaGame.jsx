// واجهة لعبة الأسئلة (كويز جماعي) — متعددة اللاعبين (2–8)
import {
  QUESTIONS_PER_GAME, activeSeats, currentQuestion, startGame, answerQuestion,
  forceReveal, nextQuestion, resetGame, rankings,
} from './logic'
import './trivia.css'

const LABELS = ['أ', 'ب', 'ج', 'د']

export default function TriviaGame({ state, seat, players, commit, code }) {
  const seats = Object.keys(players).map(Number).sort((a, b) => a - b)
  const nameOf = (s) => players[s]?.name || `لاعب ${s + 1}`
  const isHost = seat === 0
  const ctx = { state, seat, seats, nameOf, isHost, commit, code }

  switch (state.phase) {
    case 'question': return <QuestionView {...ctx} />
    case 'reveal': return <RevealView {...ctx} />
    case 'results': return <ResultsView {...ctx} />
    default: return <Lobby {...ctx} />
  }
}

function Lobby({ seat, seats, nameOf, isHost, commit, code }) {
  const enough = seats.length >= 2
  const start = () => commit((s, room) => startGame(s, activeSeats(room)))
  return (
    <div className="tv">
      <div className="tv-emoji-big">🧠</div>
      <h2 className="tv-title">سابقن!</h2>
      <div className="tv-share">شارك الكود مع صاحبك:<div className="room-code">{code}</div></div>
      <PlayerChips seats={seats} nameOf={nameOf} seat={seat} />
      <div className="tv-note">{seats.length} لاعبين · {QUESTIONS_PER_GAME} أسئلة</div>
      {isHost ? (
        <button className="btn btn-primary" disabled={!enough} onClick={start}>ابدأ اللعبة</button>
      ) : (
        <div className="notice">بانتظار بدء المضيف… ⏳</div>
      )}
    </div>
  )
}

function ProgressScores({ state, nameOf, seat }) {
  const ranked = rankings(state.scores)
  return (
    <div className="tv-scores">
      {ranked.map(({ seat: s, score }) => (
        <span key={s} className={`tv-score-chip${s === seat ? ' me' : ''}`}>
          {nameOf(s)} <b>{score}</b>
        </span>
      ))}
    </div>
  )
}

function QuestionView({ state, seat, seats, nameOf, isHost, commit }) {
  const q = currentQuestion(state)
  const qi = state.current
  const myAnswer = seat !== null ? state.answers[qi]?.[seat] : undefined
  const answeredCount = Object.keys(state.answers[qi] || {}).length
  const locked = myAnswer !== undefined || seat === null

  const answer = (opt) => commit((s, room) => answerQuestion(s, seat, opt, activeSeats(room)))
  const skip = () => commit((s) => forceReveal(s))

  return (
    <div className="tv">
      <div className="tv-qnum">سؤال {qi + 1} / {state.qIndices.length}</div>
      <div className="tv-question">{q.q}</div>
      <div className="tv-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`tv-option${myAnswer === i ? ' chosen' : ''}`}
            disabled={locked}
            onClick={() => answer(i)}
          >
            <span className="tv-label">{LABELS[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
      <div className="tv-note">
        {locked ? 'بانتظار البقية…' : 'اختر إجابتك'} · جاوب {answeredCount}/{seats.length}
      </div>
      {isHost && <button className="btn" onClick={skip}>اكشف الإجابة الآن</button>}
      <ProgressScores state={state} seats={seats} nameOf={nameOf} seat={seat} />
    </div>
  )
}

function RevealView({ state, seat, seats, nameOf, isHost, commit }) {
  const q = currentQuestion(state)
  const qi = state.current
  const roundAnswers = state.answers[qi] || {}
  const myAnswer = seat !== null ? roundAnswers[seat] : undefined
  const iGotIt = myAnswer === q.correct
  const myGain = seat !== null ? (state.gains?.[qi]?.[seat] ?? 0) : 0
  const isLast = state.current + 1 >= state.qIndices.length

  const next = () => commit((s) => nextQuestion(s))

  return (
    <div className="tv">
      <div className="tv-qnum">سؤال {qi + 1} / {state.qIndices.length}</div>
      <div className="tv-question">{q.q}</div>
      <div className="tv-options">
        {q.options.map((opt, i) => {
          const right = i === q.correct
          const chosenWrong = myAnswer === i && !right
          return (
            <div key={i} className={`tv-option reveal${right ? ' right' : ''}${chosenWrong ? ' wrong' : ''}`}>
              <span className="tv-label">{LABELS[i]}</span>
              <span>{opt}</span>
              {right && <span className="tv-mark">✓</span>}
            </div>
          )
        })}
      </div>
      {seat !== null && (
        <div className={`tv-verdict ${iGotIt ? 'good' : 'bad'}`}>
          {iGotIt
            ? (myGain > 0 ? `إجابة صحيحة! +${myGain} 🎉` : 'إجابة صحيحة (بدون نقاط — سبقك غيرك) ✅')
            : (myAnswer === undefined ? 'ما جاوبت ⏱️' : 'إجابة خاطئة')}
        </div>
      )}
      <ProgressScores state={state} seats={seats} nameOf={nameOf} seat={seat} />
      {isHost ? (
        <button className="btn btn-primary" onClick={next}>{isLast ? 'النتيجة النهائية 🏆' : 'السؤال التالي ←'}</button>
      ) : (
        <div className="notice">بانتظار المضيف…</div>
      )}
    </div>
  )
}

function ResultsView({ state, seat, nameOf, isHost, commit }) {
  const ranked = rankings(state.scores)
  const topScore = ranked[0]?.score ?? 0
  const winners = ranked.filter((r) => r.score === topScore && topScore > 0)
  const reset = () => commit(() => resetGame())

  return (
    <div className="tv">
      <div className="tv-emoji-big">🏆</div>
      <div className="tv-verdict good">
        {winners.length === 1
          ? `الفائز: ${nameOf(winners[0].seat)}${winners[0].seat === seat ? ' (أنت)' : ''}`
          : 'تعادل في الصدارة!'}
      </div>
      <div className="tv-podium">
        {ranked.map(({ seat: s, score }, i) => (
          <div key={s} className={`tv-rank${s === seat ? ' me' : ''}${i === 0 ? ' first' : ''}`}>
            <span className="tv-rank-pos">{i + 1}</span>
            <span className="tv-rank-name">{nameOf(s)}{s === seat ? ' (أنت)' : ''}</span>
            <span className="tv-rank-score">{score}</span>
          </div>
        ))}
      </div>
      {isHost && <button className="btn btn-primary" onClick={reset}>لعبة جديدة 🔁</button>}
    </div>
  )
}

function PlayerChips({ seats, nameOf, seat }) {
  return (
    <div className="tv-players">
      {seats.map((s) => (
        <span key={s} className="tv-chip">{nameOf(s)}{s === seat ? ' (أنت)' : ''}</span>
      ))}
    </div>
  )
}
