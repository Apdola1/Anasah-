// منطق لعبة الكلمة (Wordle عربي) — دوال صافية
// نمطان:
//   'setter' واضع/مخمّن: المقعد 0 يضع كلمة سرية، المقعد 1 يخمّن.
//   'race'   سباق: كلمة عشوائية للاثنين، كل واحد له لوحه، وأول من يحلها يفوز.
import { normalize, toLetters, WORD_LEN, isValidLength, randomWord } from './words'

export { WORD_LEN, isValidLength, randomWord }
export const MAX_GUESSES = 6

export function createInitialState() {
  return {
    mode: null,        // null | 'setter' | 'race'
    phase: 'setup',    // 'setup' | 'playing'
    secret: null,      // كلمة العرض السرية
    guesses: { 0: [], 1: [] },
    done: { 0: false, 1: false }, // انتهى اللاعب (حلّها أو خلصت محاولاته)
    winner: null,      // null | 0 | 1 | 'draw'
  }
}

// تلوين تخمين مقابل الكلمة السرية: لكل خانة 'correct' | 'present' | 'absent'
export function scoreGuess(guess, secret) {
  const g = toLetters(guess)
  const s = toLetters(secret)
  const result = new Array(g.length).fill('absent')
  const counts = {}
  for (const ch of s) counts[ch] = (counts[ch] || 0) + 1

  // تمريرة أولى: الصحيح في مكانه
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      result[i] = 'correct'
      counts[g[i]]--
    }
  }
  // تمريرة ثانية: موجود بمكان خطأ (مع احترام العدد)
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue
    if (counts[g[i]] > 0) {
      result[i] = 'present'
      counts[g[i]]--
    }
  }
  return result
}

export function isSolved(guess, secret) {
  return normalize(guess) === normalize(secret)
}

// أفضل حالة معروفة لكل حرف عبر كل تخمينات اللاعب (لتلوين لوحة المفاتيح)
export function letterStatuses(guesses, secret) {
  const rank = { absent: 0, present: 1, correct: 2 }
  const map = {}
  for (const guess of guesses) {
    const score = scoreGuess(guess, secret)
    const g = toLetters(guess)
    for (let i = 0; i < g.length; i++) {
      const cur = map[g[i]]
      if (cur === undefined || rank[score[i]] > rank[cur]) map[g[i]] = score[i]
    }
  }
  return map
}

// اختيار النمط (يستدعيه المقعد 0). لنمط السباق نختار كلمة ونبدأ فوراً.
export function chooseMode(state, mode) {
  if (state.phase !== 'setup' || state.mode !== null) return null
  if (mode === 'race') {
    return { ...state, mode: 'race', secret: randomWord(), phase: 'playing' }
  }
  if (mode === 'setter') {
    return { ...state, mode: 'setter' } // يبقى في الإعداد حتى يكتب الكلمة
  }
  return null
}

// المقعد 0 يضبط الكلمة السرية (نمط الواضع)
export function setSecret(state, word) {
  if (state.mode !== 'setter' || state.phase !== 'setup') return null
  if (!isValidLength(word)) return null
  return { ...state, secret: word, phase: 'playing' }
}

// تقديم تخمين من مقعد معيّن. يرجّع الحالة الجديدة أو null لو غير مسموح.
export function submitGuess(state, seat, word) {
  if (state.phase !== 'playing' || state.winner !== null) return null
  if (!isValidLength(word)) return null

  // في نمط الواضع، المخمّن فقط (المقعد 1) يلعب
  if (state.mode === 'setter' && seat !== 1) return null
  if (state.done[seat]) return null
  if (state.guesses[seat].length >= MAX_GUESSES) return null

  const guesses = { ...state.guesses, [seat]: [...state.guesses[seat], word] }
  const solved = isSolved(word, state.secret)
  const out = guesses[seat].length >= MAX_GUESSES
  const done = { ...state.done, [seat]: solved || out }

  let winner = state.winner
  if (state.mode === 'setter') {
    if (solved) winner = 1        // المخمّن فاز
    else if (out) winner = 0      // الواضع فاز (خلصت المحاولات)
  } else {
    // سباق: أول من يحل يفوز
    if (solved) winner = seat
    else if (done[0] && done[1]) winner = 'draw'
  }

  return { ...state, guesses, done, winner }
}
