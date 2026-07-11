// واجهة لعبة أربعة على التوالي
import { COLS, ROWS, COLORS, NAMES, lowestEmptyRow, applyMove } from './logic'
import './connect4.css'

export default function Connect4Board({ state, seat, players, onMove }) {
  const isSpectator = seat === null
  const isMyTurn = !isSpectator && state.turn === seat && state.winner === null

  function dropIn(col) {
    if (!isMyTurn) return
    const next = applyMove(state, seat, col)
    if (next) onMove(next)
  }

  return (
    <div className="c4">
      <TurnBanner state={state} seat={seat} players={players} />
      <div className="c4-board">
        {Array.from({ length: COLS }).map((col, c) => {
          const playable = isMyTurn && lowestEmptyRow(state.board, c) !== -1
          return (
            <button
              key={c}
              className={`c4-col${playable ? ' playable' : ''}`}
              onClick={() => dropIn(c)}
              disabled={!playable}
            >
              {Array.from({ length: ROWS }).map((cell, r) => {
                const v = state.board[r * COLS + c]
                const isWin = state.winningLine?.includes(r * COLS + c)
                return (
                  <span key={r} className="c4-hole">
                    {v !== null && (
                      <span
                        className={`c4-disc${isWin ? ' win' : ''}`}
                        style={{ background: COLORS[v] }}
                      />
                    )}
                  </span>
                )
              })}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TurnBanner({ state, seat, players }) {
  let text
  let tone = ''
  const dot = (v) => <span className="c4-dot" style={{ background: COLORS[v] }} />

  if (state.winner === 'draw') {
    text = <>تعادل! 🤝</>
  } else if (state.winner !== null) {
    const winnerName = players[state.winner]?.name || NAMES[state.winner]
    const iWon = state.winner === seat
    text = iWon ? <>فزت يا بطل! 🎉</> : <>فاز {winnerName} {dot(state.winner)}</>
    tone = iWon ? 'good' : ''
  } else {
    const myTurn = state.turn === seat
    const turnName = players[state.turn]?.name || NAMES[state.turn]
    text = myTurn ? <>دورك {dot(state.turn)}</> : <>دور {turnName} {dot(state.turn)}</>
    tone = myTurn ? 'active' : ''
  }
  return <div className={`c4-banner ${tone}`}>{text}</div>
}
