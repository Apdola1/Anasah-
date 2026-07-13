// منطق لعبة الأسئلة (كويز جماعي) — دوال صافية
// المراحل: 'lobby' → 'question' → 'reveal' → (تكرار) → 'results'
import { QUESTIONS, pickQuestions } from './questions'

export const QUESTIONS_PER_GAME = 7
export const POINTS_CORRECT = 10
export const BONUS_FIRST = 5 // مكافأة لأول من يجاوب صح

export function createInitialState() {
  return {
    phase: 'lobby',
    qIndices: [],   // فهارس الأسئلة المختارة من البنك
    current: 0,     // رقم السؤال الحالي (0..n-1)
    answers: {},    // { [current]: { [seat]: optionIndex } }
    scores: {},     // { [seat]: نقاط }
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
    qIndices: pickQuestions(QUESTIONS_PER_GAME),
    current: 0,
    answers: {},
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
  const someoneCorrectBefore = Object.values(prev).some((o) => o === correct)

  let gain = 0
  if (isCorrect) {
    gain = POINTS_CORRECT
    if (!someoneCorrectBefore) gain += BONUS_FIRST
  }

  const answers = { ...state.answers, [qi]: { ...prev, [seat]: optionIndex } }
  const scores = { ...state.scores, [seat]: (state.scores[seat] || 0) + gain }
  const allAnswered = seats.every((s) => answers[qi][s] !== undefined)

  return { ...state, answers, scores, phase: allAnswered ? 'reveal' : 'question' }
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
