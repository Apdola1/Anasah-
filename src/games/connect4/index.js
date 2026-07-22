// تعريف لعبة أربعة على التوالي كـ"قطعة" على منصة أناسة
import Connect4Board from './Connect4Board'
import { createInitialState } from './logic'

export default {
  id: 'connect4',
  name: 'أربعة على التوالي',
  emoji: '🔵',
  tagline: 'نزّل قرصك واجمع أربعة قبل خصمك',
  howTo: [
    'تتبادلون الأدوار — في دورك اضغط عموداً لتنزّل قرصك فيه',
    'القرص يسقط لأسفل مكان فاضي في العمود',
    'أول من يصفّ ٤ أقراص متتالية (أفقي، عمودي، أو قطري) يفوز',
  ],
  color: 'linear-gradient(135deg, #8b7bff, #5b8cff)',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  Component: Connect4Board,
}
