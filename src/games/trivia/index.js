// تعريف لعبة الأسئلة كـ"قطعة" على منصة أناسة (متعددة اللاعبين)
import TriviaGame from './TriviaGame'
import { createInitialState } from './logic'

export default {
  id: 'trivia',
  name: 'سابقن!',
  emoji: '🧠',
  tagline: 'سباق اسئلة، جاوب صح أسرع من غيرك!',
  howTo: [
    'السؤال يطلع للجميع بنفس اللحظة — جاوب صح وبسرعة',
    'أسرع إجابة صحيحة = نقطتان، اللي بعده = نقطة، الباقي صفر',
    'بعد ٧ أسئلة، صاحب أعلى النقاط يفوز 🏆',
  ],
  color: 'linear-gradient(135deg, #22d3ee, #6366f1)',
  minPlayers: 1,      // تدير لوبيها بنفسها (تبدأ فعلياً بلاعبَين+)
  maxPlayers: 8,
  hidePlayersBar: true,
  createInitialState,
  Component: TriviaGame,
}
