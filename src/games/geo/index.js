// تعريف لعبة الجغرافيا كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import GeoGame from './GeoGame'
import { createInitialState } from './logic'

export default {
  id: 'geo',
  name: 'حصان طروادة',
  emoji: '🌍',
  tagline: 'خمّن دولة خصمك من المسافة والاتجاه!',
  color: 'linear-gradient(135deg, #34d399, #2563eb)',
  minPlayers: 1,      // تدير لوبيها بنفسها (تبدأ فعلياً بلاعبَين+)
  maxPlayers: 8,
  hidePlayersBar: true,
  createInitialState,
  Component: GeoGame,
}
