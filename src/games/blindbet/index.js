// تعريف «الرهان الأعمى» كـ"قطعة" على منصة أناسة
import BlindBetGame from './BlindBetGame'
import { createInitialState } from './logic'

export default {
  id: 'blindbet',
  name: 'الرهان الأعمى',
  emoji: '🃏',
  tagline: 'راهن قبل ما يظهر السؤال — الأعلى نقاطاً يفوز',
  howTo: [
    'قدامكم ١٠ كروت أسئلة مخفية — بالدور، اختر كرتاً',
    'راهن من 1 إلى 5 قبل ما يظهر لك السؤال 😉',
    'جاوبت صح: +رهانك · أخطأت: −رهانك (وممكن تنزل تحت الصفر)',
    'بعد الـ١٠ كروت، الأعلى نقاطاً يفوز',
  ],
  color: 'linear-gradient(135deg, #a855f7, #6d28d9)',
  minPlayers: 2,
  maxPlayers: 2,
  hidePlayersBar: true, // ترسم لوحة نقاطها بنفسها
  ownRestart: true,     // ترسم زر «لعبة جديدة» بنفسها (تجنّب تكرار زر المنصة)
  createInitialState,
  Component: BlindBetGame,
}
