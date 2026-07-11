// تعريف لعبة الكلمة (Wordle عربي) كـ"قطعة" على منصة أناسة
import WordleBoard from './WordleBoard'
import { createInitialState } from './logic'

export default {
  id: 'wordle',
  name: 'خمّن الكلمة',
  emoji: '🔤',
  tagline: 'واضع/مخمّن أو سباق — كلمات عربية',
  color: 'linear-gradient(135deg, #4ade80, #22d3ee)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: WordleBoard,
}
