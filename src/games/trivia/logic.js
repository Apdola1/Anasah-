// منطق لعبة الأسئلة (كويز جماعي) — دوال صافية
// المراحل: 'lobby' → 'question' → 'reveal' → (تكرار) → 'results'
import { QUESTIONS, pickQuestions } from './questions'

export const QUESTIONS_PER_GAME = 7
export const POINTS_FIRST = 2  // أسرع من يجاوب صح
export const POINTS_SECOND = 1 // الذي يليه

export function createInitialState() {
  return {
    phase: 'lobby',
    qIndices: [],   // فهارس الأسئلة المختارة من البنك
    current: 0,     // رقم السؤال الحالي (0..n-1)
    answers: {},    // { [current]: { [seat]: optionIndex } }
    gains: {},      // { [current]: { [seat]: نقاط هذا السؤال } }
    scores: {},     // { [seat]: مجموع النقاط }
  }
}

// المقاعد النشطة من مستند الغرفة
export function activeSeats(room) {
  return room.seats
    .map((uid, i) => (uid !== null ? i : null))
    .filter((i) => i !== null)
}

// السؤال الحالي (كائن من البنك) لحالة معيّنة
export function currentQuestion(state) {
  const bankIdx = state.qIndices[state.current]
  return QUESTIONS[bankIdx]
}

export function startGame(state, seats) {
  if (state.phase !== 'lobby') return null
  if (seats.length < 2) return null
  const scores = {}
  seats.forEach((s) => { scores[s] = 0 })
  return {
    phase: 'question',
    qIndices: pickQuestions(QUESTIONS_PER_GAME, 'trivia'),
    current: 0,
    answers: {},
    gains: {},
    scores,
  }
}

// تسجيل إجابة لاعب على السؤال الحالي
export function answerQuestion(state, seat, optionIndex, seats) {
  if (state.phase !== 'question') return null
  if (seat === null) return null
  const qi = state.current
  const prev = state.answers[qi] || {}
  if (prev[seat] !== undefined) return null // جاوب مسبقاً

  const correct = QUESTIONS[state.qIndices[qi]].correct
  const isCorrect = optionIndex === correct
  // كم عدد من أجاب صح قبل هذا اللاعب (prev = الإجابات الأسبق زمنياً)
  const correctBefore = Object.values(prev).filter((o) => o === correct).length

  let gain = 0
  if (isCorrect) {
    if (correctBefore === 0) gain = POINTS_FIRST       // الأسرع
    else if (correctBefore === 1) gain = POINTS_SECOND // الذي يليه
  }

  const answers = { ...state.answers, [qi]: { ...prev, [seat]: optionIndex } }
  const gains = { ...state.gains, [qi]: { ...(state.gains[qi] || {}), [seat]: gain } }
  const scores = { ...state.scores, [seat]: (state.scores[seat] || 0) + gain }
  const allAnswered = seats.every((s) => answers[qi][s] !== undefined)

  return { ...state, answers, gains, scores, phase: allAnswered ? 'reveal' : 'question' }
}

// إجبار كشف الإجابة (المضيف)
export function forceReveal(state) {
  if (state.phase !== 'question') return null
  return { ...state, phase: 'reveal' }
}

// السؤال التالي (أو النتائج لو خلصت الأسئلة)
export function nextQuestion(state) {
  if (state.phase !== 'reveal') return null
  const next = state.current + 1
  if (next >= state.qIndices.length) return { ...state, phase: 'results' }
  return { ...state, current: next, phase: 'question' }
}

export function resetGame() {
  return createInitialState()
}

// ترتيب اللاعبين حسب النقاط (تنازلي): [{ seat, score }]
export function rankings(scores) {
  return Object.entries(scores)
    .map(([seat, score]) => ({ seat: Number(seat), score }))
    .sort((a, b) => b.score - a.score)
}
