// واجهة «الرهان الأعمى» — لاعبان، بالأدوار
import {
  NUM_CARDS, MIN_BET, MAX_BET, questionOfCard,
  pickCard, placeBet, answerCard, nextTurn, resetGame, winnerOf, cardsUsedCount,
} from './logic'
import './blindbet.css'

const LABELS = ['أ', 'ب', 'ج', 'د']
const toAr = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])

export default function BlindBetGame({ state, seat, players, commit }) {
  const nameOf = (s) => players[s]?.name || `لاعب ${s + 1}`
  const myTurn = seat !== null && state.turn === seat
  const ctx = { state, seat, myTurn, nameOf, commit }

  return (
    <div className="bb">
      <Scoreboard state={state} seat={seat} nameOf={nameOf} />
      {state.phase === 'pick' && <Pick {...ctx} />}
      {state.phase === 'bet' && <Bet {...ctx} />}
      {state.phase === 'question' && <Question {...ctx} />}
      {state.phase === 'reveal' && <Reveal {...ctx} />}
      {state.phase === 'results' && <Results {...ctx} />}
    </div>
  )
}

function Scoreboard({ state, seat, nameOf }) {
  return (
    <div className="bb-scoreboard">
      {[0, 1].map((s) => (
        <div key={s} className={`bb-score${state.turn === s && state.phase !== 'results' ? ' turn' : ''}${s === seat ? ' me' : ''}`}>
          <span className="bb-score-name">{nameOf(s)}{s === seat ? ' (أنت)' : ''}</span>
          <span className="bb-score-val">{state.scores[s]}</span>
        </div>
      ))}
      {state.phase !== 'results' && (
        <div className="bb-progress">كرت {toAr(cardsUsedCount(state) + 1)} / {toAr(NUM_CARDS)}</div>
      )}
    </div>
  )
}

function Pick({ state, seat, myTurn, nameOf, commit }) {
  return (
    <>
      <div className={`bb-turn${myTurn ? ' active' : ''}`}>
        {myTurn ? 'دورك — اختر كرت 🃏' : `دور ${nameOf(state.turn)} يختار… 👀`}
      </div>
      <div className="bb-cards">
        {state.cards.map((_, i) => (
          <button
            key={i}
            className={`bb-card${state.used[i] ? ' used' : ''}`}
            disabled={!myTurn || state.used[i]}
            onClick={() => commit((s) => pickCard(s, seat, i))}
          >
            {state.used[i] ? '✓' : toAr(i + 1)}
          </button>
        ))}
      </div>
    </>
  )
}

function Bet({ state, seat, myTurn, nameOf, commit }) {
  return (
    <>
      <div className="bb-selected">الكرت {toAr(state.selectedCard + 1)} 🃏</div>
      <div className={`bb-turn${myTurn ? ' active' : ''}`}>
        {myTurn ? 'راهن قبل ما يظهر السؤال!' : `${nameOf(state.turn)} يراهن… 🤔`}
      </div>
      {myTurn && (
        <div className="bb-bets">
          {Array.from({ length: MAX_BET - MIN_BET + 1 }, (_, k) => MIN_BET + k).map((n) => (
            <button key={n} className="bb-bet" onClick={() => commit((s) => placeBet(s, seat, n))}>
              {toAr(n)}
            </button>
          ))}
        </div>
      )}
      <div className="bb-hint">صح: +نقاط الرهان · خطأ: −نقاط الرهان</div>
    </>
  )
}

function Question({ state, seat, myTurn, nameOf, commit }) {
  const q = questionOfCard(state, state.selectedCard)
  return (
    <>
      <div className="bb-bet-tag">رهانك: {toAr(state.bet)} نقاط 🎯</div>
      <div className="bb-question">{q.q}</div>
      <div className="bb-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className="bb-option"
            disabled={!myTurn}
            onClick={() => commit((s) => answerCard(s, seat, i))}
          >
            <span className="bb-label">{LABELS[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
      {!myTurn && <div className="bb-turn">{nameOf(state.turn)} يجاوب… ⏳</div>}
    </>
  )
}

function Reveal({ state, seat, nameOf, commit }) {
  const r = state.lastResult
  const q = questionOfCard(state, r.card)
  const mine = r.seat === seat
  let text
  if (r.correct) text = mine ? `صح! أخذت +${toAr(r.bet)} 🎉` : `${nameOf(r.seat)} جاوب صح +${toAr(r.bet)}`
  else text = mine ? `خطأ! خسرت ${toAr(r.bet)} 😬` : `${nameOf(r.seat)} أخطأ −${toAr(r.bet)}`

  return (
    <>
      <div className={`bb-result ${r.correct ? 'good' : 'bad'}`}>{text}</div>
      <div className="bb-options">
        {q.options.map((opt, i) => {
          const right = i === r.correctOption
          const chosenWrong = i === r.answer && !right
          return (
            <div key={i} className={`bb-option reveal${right ? ' right' : ''}${chosenWrong ? ' wrong' : ''}`}>
              <span className="bb-label">{LABELS[i]}</span>
              <span>{opt}</span>
              {right && <span className="bb-mark">✓</span>}
            </div>
          )
        })}
      </div>
      <button className="btn btn-primary" onClick={() => commit((s) => nextTurn(s))}>التالي ←</button>
    </>
  )
}

function Results({ state, seat, nameOf, commit }) {
  const w = winnerOf(state.scores)
  return (
    <>
      <div className="bb-emoji-big">🏆</div>
      <div className={`bb-result ${w === 'tie' ? '' : 'good'}`}>
        {w === 'tie' ? 'تعادل!' : `الفائز: ${nameOf(w)}${w === seat ? ' (أنت)' : ''} 🎉`}
      </div>
      <div className="bb-final">
        {[0, 1].map((s) => (
          <div key={s} className={`bb-final-row${s === w ? ' win' : ''}`}>
            <span>{nameOf(s)}{s === seat ? ' (أنت)' : ''}</span>
            <span className="bb-final-score">{state.scores[s]}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => commit(() => resetGame())}>لعبة جديدة 🔁</button>
    </>
  )
}
