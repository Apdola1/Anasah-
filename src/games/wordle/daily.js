// كلمة اليوم للنمط الفردي — كلمة واحدة لكل يوم (نفسها للجميع)، وتُحفظ محاولاتك محلياً
import { WORDS } from './words'

const START = new Date(2026, 0, 1) // تاريخ مرجعي

// رقم اليوم منذ التاريخ المرجعي (بالتوقيت المحلي)
export function dayIndex() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.floor((today - START) / 86400000)
}

export function todayKey() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function dailyWord() {
  const i = ((dayIndex() % WORDS.length) + WORDS.length) % WORDS.length
  return WORDS[i]
}

const STORE_KEY = 'anasah:wordle:daily'

// يرجّع محاولات اليوم المحفوظة، أو [] لو يوم جديد
export function loadTodayGuesses() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return data.date === todayKey() ? (data.guesses || []) : []
  } catch {
    return []
  }
}

export function saveTodayGuesses(guesses) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ date: todayKey(), guesses }))
  } catch { /* تجاهل لو التخزين ممنوع */ }
}
