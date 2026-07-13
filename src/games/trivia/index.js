// تعريف لعبة الأسئلة كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import TriviaGame from './TriviaGame'
import { createInitialState } from './logic'

export default {
  id: 'trivia',
  name: 'لعبة الأسئلة',
  emoji: '🧠',
  tagline: 'كويز عربي جماعي — جاوب أسرع واجمع نقاط',
  color: 'linear-gradient(135deg, #22d3ee, #6366f1)',
  minPlayers: 1,      // تدير لوبيها بنفسها (تبدأ فعلياً بلاعبَين+)
  maxPlayers: 8,
  hidePlayersBar: true,
  createInitialState,
  Component: TriviaGame,
}
