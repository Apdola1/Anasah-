// سجل الألعاب — قلب المنصة.
// تبي تضيف لعبة جديدة؟ سوّ مجلد تحت games/ وأضفه هنا. بس.
import xo from './xo'
import connect4 from './connect4'

export const games = [xo, connect4]

// ألعاب قادمة (للعرض في المعرض فقط، تُبنى لاحقاً)
export const comingSoon = [
  { id: 'words', name: 'خمّن الكلمة', emoji: '🔤', color: 'linear-gradient(135deg, #4ade80, #22d3ee)' },
  { id: 'cards', name: 'لعبة ورق', emoji: '🎴', color: 'linear-gradient(135deg, #ff6b81, #ff9a3d)' },
]

export function getGame(id) {
  return games.find((g) => g.id === id) || null
}
