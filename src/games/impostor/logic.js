// منطق لعبة الإمبوستر — دوال صافية
// المراحل: 'lobby' → ('picking') → 'reveal' → 'voting' → 'results'
import { randomTopic } from './topics'

export const MIN_TO_START = 3
export const TIMER_PRESETS = [60, 180, 300] // دقيقة، ٣ دقائق، ٥ دقائق

// عشوائية قوية بدون أنماط (تُستعمل لاختيار الإمبوستر ومن يبدأ)
function randInt(n) {
  if (n <= 0) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // رفض المعاينات المتحيّزة للحصول على توزيع منتظم تماماً
    const max = Math.floor(0xffffffff / n) * n
    const buf = new Uint32Array(1)
    let x
    do { crypto.getRandomValues(buf); x = buf[0] } while (x >= max)
    return x % n
  }
  return Math.floor(Math.random() * n)
}

export function createInitialState() {
  return {
    phase: 'lobby',
    impostorSeat: null,   // مقعد الإمبوستر
    topic: null,          // { word, hint }
    votes: {},            // { [مقعد المصوِّت]: مقعد المُصوَّت عليه }
    starterSeat: null,    // مقعد اللاعب الذي يبدأ (لو فُعّل الخيار)
    timerEndsAt: null,    // طابع زمني (ms) لنهاية مؤقّت النقاش
    settings: {
      timerEnabled: false,
      timerSeconds: 60,
      pickStarter: false,
    },
  }
}

// المقاعد النشطة (اللي فيها لاعبين) من مستند الغرفة
export function activeSeats(room) {
  return room.seats
    .map((uid, i) => (uid !== null ? i : null))
    .filter((i) => i !== null)
}

// المضيف يعدّل إعدادات اللعبة (في اللوبي فقط)
export function updateSettings(state, patch) {
  if (state.phase !== 'lobby') return null
  return { ...state, settings: { ...state.settings, ...patch } }
}

// دخول مرحلة الكشف مع ضبط مؤقّت النقاش لو كان مفعّلاً
function enterReveal(state) {
  const s = state.settings || {}
  const timerEndsAt = s.timerEnabled ? Date.now() + (s.timerSeconds || 60) * 1000 : null
  return { ...state, phase: 'reveal', timerEndsAt }
}

// بدء اللعبة: اختيار إمبوستر عشوائي وموضوع (+ من يبدأ لو فُعّل)
export function startGame(state, seats) {
  if (state.phase !== 'lobby') return null
  if (seats.length < MIN_TO_START) return null
  const impostorSeat = seats[randInt(seats.length)]
  const base = {
    ...state,
    impostorSeat,
    topic: randomTopic(),
    votes: {},
    timerEndsAt: null,
    starterSeat: null,
  }
  if (state.settings?.pickStarter) {
    const starterSeat = seats[randInt(seats.length)]
    return { ...base, phase: 'picking', starterSeat }
  }
  return enterReveal(base)
}

// من مشهد «مين يبدأ؟» إلى ظهور الكلمات
export function proceedToReveal(state) {
  if (state.phase !== 'picking') return null
  return enterReveal(state)
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

// إعادة اللعبة (نفس اللاعبين) مع الحفاظ على إعدادات المضيف
export function resetGame(state) {
  const init = createInitialState()
  return { ...init, settings: state?.settings || init.settings }
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
