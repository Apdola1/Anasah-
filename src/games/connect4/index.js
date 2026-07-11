// تعريف لعبة أربعة على التوالي كـ"قطعة" على منصة أناسة
import Connect4Board from './Connect4Board'
import { createInitialState } from './logic'

export default {
  id: 'connect4',
  name: 'أربعة على التوالي',
  emoji: '🔵',
  tagline: 'نزّل قرصك واجمع أربعة قبل خصمك',
  color: 'linear-gradient(135deg, #8b7bff, #5b8cff)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: Connect4Board,
}
