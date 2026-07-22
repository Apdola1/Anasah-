// تعريف لعبة الكلمة (Wordle عربي) كـ"قطعة" على منصة أناسة
import WordleBoard from './WordleBoard'
import SoloWordle from './SoloWordle'
import { createInitialState } from './logic'

export default {
  id: 'wordle',
  name: 'خمّن الكلمة',
  emoji: '🔤',
  tagline: 'كلمة اليوم منفرد، أو واضع/سباق مع صاحبك',
  howTo: [
    'خمّن الكلمة السرية (٥ حروف) خلال ٦ محاولات',
    'بعد كل تخمين تتلوّن الحروف: 🟩 بمكانه الصحيح · 🟨 موجود بمكان آخر · ⬛ غير موجود',
    '«كلمة اليوم»: العب لحالك بكلمة تتجدد كل يوم',
    'مع صاحبك: «واضع/مخمّن» يكتب لك كلمة سرية وتخمّنها، أو «سباق» — نفس الكلمة وأول من يحلّها يفوز',
  ],
  color: 'linear-gradient(135deg, #4ade80, #22d3ee)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: WordleBoard,
  // نمط فردي (بدون غرفة) — يظهر كزر في اللوبي
  SoloComponent: SoloWordle,
  soloLabel: 'كلمة اليوم 🗓️',
}
