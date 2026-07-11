// تعريف لعبة الإمبوستر كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import ImpostorGame from './ImpostorGame'
import { createInitialState } from './logic'

export default {
  id: 'impostor',
  name: 'الإمبوستر',
  emoji: '🥷',
  tagline: 'لاقوا الدخيل بينكم — ٣ لاعبين أو أكثر',
  color: 'linear-gradient(135deg, #ef4444, #7f1d1d)',
  minPlayers: 1,      // اللعبة تدير لوبيها بنفسها (تبدأ فعلياً بـ ٣+)
  maxPlayers: 8,
  hidePlayersBar: true, // ترسم قائمة اللاعبين بنفسها
  createInitialState,
  Component: ImpostorGame,
}
