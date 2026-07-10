// واجهة لعبة إكس أو
import { SYMBOLS, applyMove } from './logic'
import './xo.css'

export default function XOBoard({ state, seat, players, onMove }) {
  const isSpectator = seat === null
  const isMyTurn = !isSpectator && state.turn === seat && state.winner === null

  function handleClick(index) {
    if (!isMyTurn) return
    const next = applyMove(state, seat, index)
    if (next) onMove(next)
  }

  return (
    <div className="xo">
      <TurnBanner state={state} seat={seat} players={players} />
      <div className="xo-board">
        {state.board.map((cell, i) => {
          const isWin = state.winningLine?.includes(i)
          return (
            <button
              key={i}
              className={`xo-cell${isWin ? ' win' : ''}`}
              onClick={() => handleClick(i)}
              disabled={!isMyTurn || cell !== null}
            >
              {cell !== null ? SYMBOLS[cell] : ''}
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
  if (state.winner === 'draw') {
    text = 'تعادل! 🤝'
  } else if (state.winner !== null) {
    const winnerName = players[state.winner]?.name || SYMBOLS[state.winner]
    const iWon = state.winner === seat
    text = iWon ? `فزت يا بطل! 🎉` : `فاز ${winnerName} ${SYMBOLS[state.winner]}`
    tone = iWon ? 'good' : ''
  } else {
    const myTurn = state.turn === seat
    const turnName = players[state.turn]?.name || SYMBOLS[state.turn]
    text = myTurn ? `دورك ${SYMBOLS[state.turn]}` : `دور ${turnName} ${SYMBOLS[state.turn]}`
    tone = myTurn ? 'active' : ''
  }
  return <div className={`xo-banner ${tone}`}>{text}</div>
}
