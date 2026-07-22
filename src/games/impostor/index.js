// تعريف لعبة الإمبوستر كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import ImpostorGame from './ImpostorGame'
import { createInitialState } from './logic'

export default {
  id: 'impostor',
  name: 'الإمبوستر',
  emoji: '🥷',
  tagline: 'لاقوا الدخيل بينكم — ٣ لاعبين أو أكثر',
  howTo: [
    'تدخلون ٣ لاعبين أو أكثر — الكل يشوف نفس الموضوع، إلا واحد (الإمبوستر) يوصله تلميح فقط',
    'كل واحد يوصف الموضوع بدون ما يفضحه، والإمبوستر يحاول يندمج',
    'بعد النقاش صوّتوا على اللي تشكون فيه',
    'صدتوا الإمبوستر؟ مبروك الفوز. فلت؟ فاز هو 🥷',
  ],
  color: 'linear-gradient(135deg, #ef4444, #7f1d1d)',
  minPlayers: 1,      // اللعبة تدير لوبيها بنفسها (تبدأ فعلياً بـ ٣+)
  maxPlayers: 8,
  hidePlayersBar: true, // ترسم قائمة اللاعبين بنفسها
  createInitialState,
  Component: ImpostorGame,
}
