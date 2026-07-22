// تعريف لعبة إكس أو كـ "قطعة" تركّب على منصة أناسة
import XOBoard from './XOBoard'
import { createInitialState } from './logic'

export default {
  id: 'xo',
  name: 'إكس أو',
  emoji: '⭕️',
  tagline: 'ثلاثة على التوالي، أول لعبة على المنصة',
  howTo: [
    'أنت ❌ وصاحبك ⭕️ — تتبادلون الأدوار على شبكة ٣×٣',
    'في دورك، اضغط أي خانة فاضية لتضع رمزك',
    'أول من يصفّ ٣ رموز متتالية (أفقي، عمودي، أو قطري) يفوز',
  ],
  color: 'linear-gradient(135deg, #ffb454, #ff6b81)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: XOBoard,
}
