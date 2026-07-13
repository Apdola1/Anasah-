// تعريف لعبة الكلمة (Wordle عربي) كـ"قطعة" على منصة أناسة
import WordleBoard from './WordleBoard'
import SoloWordle from './SoloWordle'
import { createInitialState } from './logic'

export default {
  id: 'wordle',
  name: 'خمّن الكلمة',
  emoji: '🔤',
  tagline: 'كلمة اليوم منفرد، أو واضع/سباق مع صاحبك',
  color: 'linear-gradient(135deg, #4ade80, #22d3ee)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: WordleBoard,
  // نمط فردي (بدون غرفة) — يظهر كزر في اللوبي
  SoloComponent: SoloWordle,
  soloLabel: 'كلمة اليوم 🗓️',
}
