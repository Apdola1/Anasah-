// منطق لعبة أربعة على التوالي — دوال صافية بدون واجهة أو Firebase
// المقعد (seat): 0 = أحمر ، 1 = أصفر
// اللوح: مصفوفة مسطّحة بطول 42، الفهرس = row*COLS + col
// الصف 0 = الأعلى، الصف 5 = الأسفل

export const COLS = 7
export const ROWS = 6
export const COLORS = ['#ff5a5f', '#ffcf3f'] // أحمر، أصفر
export const NAMES = ['الأحمر', 'الأصفر']

const idx = (row, col) => row * COLS + col

export function createInitialState() {
  return {
    board: Array(ROWS * COLS).fill(null),
    turn: 0,
    winner: null,       // null | 0 | 1 | 'draw'
    winningLine: null,  // مصفوفة فهارس الخانات الفائزة
  }
}

// يفحص وجود ٤ متتالية بدءاً من كل خانة في ٤ اتجاهات
export function checkWinner(board) {
  const dirs = [
    [0, 1],  // أفقي
    [1, 0],  // عمودي
    [1, 1],  // قطري ↘
    [1, -1], // قطري ↙
  ]
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const start = board[idx(row, col)]
      if (start === null) continue
      for (const [dr, dc] of dirs) {
        const line = [idx(row, col)]
        for (let step = 1; step < 4; step++) {
          const r = row + dr * step
          const c = col + dc * step
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break
          if (board[idx(r, c)] !== start) break
          line.push(idx(r, c))
        }
        if (line.length === 4) return { winner: start, winningLine: line }
      }
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', winningLine: null }
  }
  return { winner: null, winningLine: null }
}

// أقل صف فاضي في عمود، أو -1 لو العمود ممتلئ
export function lowestEmptyRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[idx(row, col)] === null) return row
  }
  return -1
}

// ينزّل قرص في عمود. يرجّع الحالة الجديدة، أو null لو غير مسموح.
export function applyMove(state, seat, col) {
  if (state.winner !== null) return null
  if (state.turn !== seat) return null
  const row = lowestEmptyRow(state.board, col)
  if (row === -1) return null // العمود ممتلئ

  const board = state.board.slice()
  board[idx(row, col)] = seat
  const { winner, winningLine } = checkWinner(board)

  return {
    board,
    turn: seat === 0 ? 1 : 0,
    winner,
    winningLine,
  }
}
