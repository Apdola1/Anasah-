// تعريف لعبة إكس أو كـ "قطعة" تركّب على منصة أناسة
import XOBoard from './XOBoard'
import { createInitialState } from './logic'

export default {
  id: 'xo',
  name: 'إكس أو',
  emoji: '⭕️',
  tagline: 'ثلاثة على التوالي، أول لعبة على المنصة',
  color: 'linear-gradient(135deg, #ffb454, #ff6b81)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: XOBoard,
}
