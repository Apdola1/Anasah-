// منطق «الرهان الأعمى» — دوال صافية. لاعبان، ١٠ كروت أسئلة مخفية.
// بنك الأسئلة مشترك مع «سابقن!» (لعبة الأسئلة)
import { QUESTIONS, pickQuestions } from '../trivia/questions'

export const NUM_CARDS = 10
export const MIN_BET = 1
export const MAX_BET = 5

// المراحل: 'pick' → 'bet' → 'question' → 'reveal' → (تكرار) → 'results'
export function createInitialState() {
  return {
    phase: 'pick',
    turn: 0,
    cards: pickQuestions(NUM_CARDS), // فهارس ١٠ أسئلة من البنك
    used: Array(NUM_CARDS).fill(false),
    scores: { 0: 0, 1: 0 },
    selectedCard: null, // الكرت المختار في الدور الحالي
    bet: null,          // الرهان الحالي
    lastResult: null,   // نتيجة آخر دور (للكشف)
  }
}

export function questionOfCard(state, cardIdx) {
  return QUESTIONS[state.cards[cardIdx]]
}

// اختيار كرت (اللاعب صاحب الدور فقط)
export function pickCard(state, seat, cardIdx) {
  if (state.phase !== 'pick' || state.turn !== seat) return null
  if (cardIdx < 0 || cardIdx >= NUM_CARDS || state.used[cardIdx]) return null
  return { ...state, phase: 'bet', selectedCard: cardIdx }
}

// وضع الرهان (والسؤال لسا مخفي)
export function placeBet(state, seat, amount) {
  if (state.phase !== 'bet' || state.turn !== seat) return null
  if (amount < MIN_BET || amount > MAX_BET) return null
  return { ...state, phase: 'question', bet: amount }
}

// الإجابة على السؤال
export function answerCard(state, seat, optionIndex) {
  if (state.phase !== 'question' || state.turn !== seat) return null
  const card = state.selectedCard
  const q = QUESTIONS[state.cards[card]]
  const correct = optionIndex === q.correct
  const delta = correct ? state.bet : -state.bet
  const scores = { ...state.scores, [seat]: state.scores[seat] + delta }
  const used = state.used.slice()
  used[card] = true
  return {
    ...state,
    phase: 'reveal',
    scores,
    used,
    lastResult: {
      seat, card, bet: state.bet, correct, delta,
      answer: optionIndex, correctOption: q.correct,
    },
  }
}

// الدور التالي (أو النتائج لو خلصت الكروت)
export function nextTurn(state) {
  if (state.phase !== 'reveal') return null
  if (state.used.every(Boolean)) return { ...state, phase: 'results' }
  return {
    ...state,
    phase: 'pick',
    turn: state.turn === 0 ? 1 : 0,
    selectedCard: null,
    bet: null,
    lastResult: null,
  }
}

export function resetGame() {
  return createInitialState()
}

// الفائز: 0 | 1 | 'tie'
export function winnerOf(scores) {
  if (scores[0] > scores[1]) return 0
  if (scores[1] > scores[0]) return 1
  return 'tie'
}

export function cardsUsedCount(state) {
  return state.used.filter(Boolean).length
}
