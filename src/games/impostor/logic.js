// منطق لعبة الإمبوستر — دوال صافية
// المراحل: 'lobby' → 'reveal' → 'voting' → 'results'
import { randomTopic } from './topics'

export const MIN_TO_START = 3

export function createInitialState() {
  return {
    phase: 'lobby',
    impostorSeat: null,   // مقعد الإمبوستر
    topic: null,          // { word, hint }
    votes: {},            // { [مقعد المصوِّت]: مقعد المُصوَّت عليه }
  }
}

// المقاعد النشطة (اللي فيها لاعبين) من مستند الغرفة
export function activeSeats(room) {
  return room.seats
    .map((uid, i) => (uid !== null ? i : null))
    .filter((i) => i !== null)
}

// بدء اللعبة: اختيار إمبوستر عشوائي وموضوع
export function startGame(state, seats) {
  if (state.phase !== 'lobby') return null
  if (seats.length < MIN_TO_START) return null
  const impostorSeat = seats[Math.floor(Math.random() * seats.length)]
  return { ...state, phase: 'reveal', impostorSeat, topic: randomTopic(), votes: {} }
}

// بدء التصويت
export function startVoting(state) {
  if (state.phase !== 'reveal') return null
  return { ...state, phase: 'voting', votes: {} }
}

// تسجيل صوت. لو صوّت الجميع → ننتقل للنتائج تلقائياً.
export function castVote(state, voterSeat, votedSeat, seats) {
  if (state.phase !== 'voting') return null
  if (voterSeat === votedSeat) return null // ما يصوّت على نفسه
  const votes = { ...state.votes, [voterSeat]: votedSeat }
  const allVoted = seats.every((s) => votes[s] !== undefined)
  return { ...state, votes, phase: allVoted ? 'results' : 'voting' }
}

// إعادة اللعبة (نفس اللاعبين)
export function resetGame() {
  return createInitialState()
}

// عدّ الأصوات: { مقعد: عدد }
export function tallyVotes(votes) {
  const counts = {}
  for (const voted of Object.values(votes)) counts[voted] = (counts[voted] || 0) + 1
  return counts
}

// المقاعد الأكثر تصويتاً (قد يتعادل أكثر من واحد)
export function topVoted(votes) {
  const counts = tallyVotes(votes)
  let max = 0
  for (const c of Object.values(counts)) if (c > max) max = c
  if (max === 0) return []
  return Object.keys(counts)
    .filter((seat) => counts[seat] === max)
    .map(Number)
}

// مين صوّت على مقعد معيّن (يرجّع مقاعد المصوّتين)
export function whoVotedFor(votes, seat) {
  return Object.entries(votes)
    .filter(([, voted]) => voted === seat)
    .map(([voter]) => Number(voter))
}
