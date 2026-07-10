// منطق لعبة إكس أو — دوال صافية بدون أي علاقة بالواجهة أو Firebase
// المقعد (seat): 0 = ❌ ، 1 = ⭕️

export const SYMBOLS = ['❌', '⭕️']

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // صفوف
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // أعمدة
  [0, 4, 8], [2, 4, 6],            // أقطار
]

export function createInitialState() {
  return {
    board: Array(9).fill(null), // كل خانة: null أو رقم المقعد
    turn: 0,                    // دور من (رقم المقعد)
    winner: null,              // null | 0 | 1 | 'draw'
    winningLine: null,
  }
}

export function checkWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: line }
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', winningLine: null }
  }
  return { winner: null, winningLine: null }
}

// يحاول لعب خانة. يرجّع الحالة الجديدة، أو null لو الحركة غير مسموحة.
export function applyMove(state, seat, index) {
  if (state.winner !== null) return null      // اللعبة خلصت
  if (state.turn !== seat) return null         // مو دورك
  if (state.board[index] !== null) return null // الخانة مشغولة

  const board = state.board.slice()
  board[index] = seat
  const { winner, winningLine } = checkWinner(board)

  return {
    board,
    turn: seat === 0 ? 1 : 0,
    winner,
    winningLine,
  }
}
