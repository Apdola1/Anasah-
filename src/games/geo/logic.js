// منطق لعبة الجغرافيا — دوال صافية
// المراحل: 'lobby' → 'countdown' (٣٢١) → 'secret' (كل لاعب يخفي دولة) → 'playing' → 'over'
// الفوز: «أول صيد» — أول لاعب يكشف دولة أي خصم يفوز. التغذية الراجعة لأقرب خصم.
import { countryOf } from './countries'

export const MIN_TO_START = 2
export const COUNTDOWN_MS = 3000

// ثوابت الاتجاهات (8 جهات) — الاتجاه من التخمين نحو الهدف
const DIRS = [
  { key: 'N', ar: 'شمال', arrow: '⬆️' },
  { key: 'NE', ar: 'شمال شرق', arrow: '↗️' },
  { key: 'E', ar: 'شرق', arrow: '➡️' },
  { key: 'SE', ar: 'جنوب شرق', arrow: '↘️' },
  { key: 'S', ar: 'جنوب', arrow: '⬇️' },
  { key: 'SW', ar: 'جنوب غرب', arrow: '↙️' },
  { key: 'W', ar: 'غرب', arrow: '⬅️' },
  { key: 'NW', ar: 'شمال غرب', arrow: '↖️' },
]

const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

// المسافة بالكيلومتر بين نقطتين (Haversine)
export function distanceKm(a, b) {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

// زاوية البوصلة الدقيقة من a إلى b بالدرجات (0=شمال، تزيد باتجاه عقارب الساعة)
// تُستعمل لتدوير سهم يشير مباشرةً نحو الدولة الهدف.
export function bearingDeg(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// جهة لفظية اختيارية (لقارئ الشاشة / تلميح مساعد) — أقرب 8 جهات
export function bearingLabel(a, b) {
  return DIRS[Math.round(bearingDeg(a, b) / 45) % 8]
}

// مستوى الحرارة حسب القرب (تلميح ممتع)
export function heatOf(km) {
  if (km === 0) return { key: 'hit', ar: 'إصابة!', emoji: '🎯' }
  if (km < 500) return { key: 'hot', ar: 'حار جداً', emoji: '🔥' }
  if (km < 1500) return { key: 'warm', ar: 'دافئ', emoji: '🟠' }
  if (km < 3500) return { key: 'cool', ar: 'بارد', emoji: '🔵' }
  return { key: 'cold', ar: 'متجمّد', emoji: '🧊' }
}

export function createInitialState() {
  return {
    phase: 'lobby',
    secrets: {},     // { [مقعد]: iso الدولة السرية }
    order: [],        // ترتيب الأدوار
    turn: null,       // مقعد صاحب الدور الحالي
    guesses: {},      // { [مقعد]: [{ iso, km, dir, heat, hit }] }
    winner: null,     // مقعد الفائز
    countAt: null,    // طابع زمني لبداية العد التنازلي
  }
}

export function activeSeats(room) {
  return room.seats
    .map((uid, i) => (uid !== null ? i : null))
    .filter((i) => i !== null)
}

// بدء اللعبة → عدّ تنازلي (٣٢١) يشوفه الجميع
export function startGame(state, seats) {
  if (state.phase !== 'lobby') return null
  if (seats.length < MIN_TO_START) return null
  return { ...createInitialState(), phase: 'countdown', countAt: Date.now() }
}

// انتهى العدّ → مرحلة اختيار الدولة السرية
export function startSecret(state) {
  if (state.phase !== 'countdown') return null
  return { ...state, phase: 'secret' }
}

// لاعب يختار (أو يغيّر) دولته السرية أثناء مرحلة السرّ
export function chooseSecret(state, seat, iso, seats) {
  if (state.phase !== 'secret') return null
  if (!countryOf(iso)) return null
  const secrets = { ...state.secrets, [seat]: iso }
  // إذا اختار الجميع → ابدأ الأدوار
  const allChosen = seats.every((s) => secrets[s] !== undefined)
  if (allChosen) {
    const order = [...seats]
    const guesses = {}
    for (const s of seats) guesses[s] = []
    return { ...state, secrets, phase: 'playing', order, turn: order[0], guesses }
  }
  return { ...state, secrets }
}

// أقرب خصم (مقعده + المسافة) لتخمين معيّن
function nearestOpponent(state, seat, guessIso, seats) {
  const g = countryOf(guessIso)
  let best = null
  for (const s of seats) {
    if (s === seat) continue
    const sec = state.secrets[s]
    if (sec === undefined) continue
    const km = distanceKm(g, countryOf(sec))
    if (best === null || km < best.km) best = { seat: s, km }
  }
  return best
}

// تخمين في الدور الحالي
export function makeGuess(state, seat, iso, seats) {
  if (state.phase !== 'playing') return null
  if (state.turn !== seat) return null
  if (!countryOf(iso)) return null

  // إصابة؟ (طابقت دولة أي خصم)
  const hitSeat = seats.find((s) => s !== seat && state.secrets[s] === iso)
  const near = nearestOpponent(state, seat, iso, seats)
  const km = hitSeat !== undefined ? 0 : near ? near.km : 0
  const g = countryOf(iso)
  const target = hitSeat !== undefined ? g : near ? countryOf(state.secrets[near.seat]) : g
  // زاوية السهم (بالدرجات) نحو أقرب دولة هدف؛ null عند الإصابة
  const bearing = km === 0 ? null : Math.round(bearingDeg(g, target))
  const heat = heatOf(km)
  const entry = { iso, km, bearing, heat: heat.key, hit: hitSeat !== undefined }

  const guesses = { ...state.guesses, [seat]: [...(state.guesses[seat] || []), entry] }

  if (hitSeat !== undefined) {
    return { ...state, guesses, phase: 'over', winner: seat }
  }
  // انتقال الدور للاعب التالي
  const order = state.order
  const i = order.indexOf(seat)
  const nextTurn = order[(i + 1) % order.length]
  return { ...state, guesses, turn: nextTurn }
}

export function resetGame() {
  return createInitialState()
}
