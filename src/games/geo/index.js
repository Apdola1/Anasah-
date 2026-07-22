// تعريف لعبة الجغرافيا كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import GeoGame from './GeoGame'
import { createInitialState } from './logic'

export default {
  id: 'geo',
  name: 'حصان طروادة',
  emoji: '🌍',
  tagline: 'خمّن دولة خصمك من المسافة والاتجاه!',
  howTo: [
    'كل لاعب يختار دولة سرية على خريطة العالم 🤫',
    'بالدور، خمّن دولة خصمك بالضغط عليها في الخريطة',
    'كل تخمين يعطيك المسافة والحرارة: 🔥 قريب جداً · 🧊 بعيد',
    'أول من يصيد دولة خصمه يفوز 🎯',
  ],
  color: 'linear-gradient(135deg, #34d399, #2563eb)',
  minPlayers: 1,      // تدير لوبيها بنفسها (تبدأ فعلياً بلاعبَين+)
  maxPlayers: 8,
  hidePlayersBar: true,
  ownRestart: true,   // ترسم زر «لعبة جديدة» بنفسها (تجنّب تكرار زر المنصة)
  createInitialState,
  Component: GeoGame,
}
