// سجل الألعاب — قلب المنصة.
// تبي تضيف لعبة جديدة؟ سوّ مجلد تحت games/ وأضفه هنا. بس.
import xo from './xo'
import connect4 from './connect4'
import wordle from './wordle'

export const games = [xo, connect4, wordle]

// ألعاب قادمة (للعرض في المعرض فقط، تُبنى لاحقاً)
export const comingSoon = [
  { id: 'impostor', name: 'الإمبوستر', emoji: '🥷', color: 'linear-gradient(135deg, #ef4444, #7f1d1d)' },
  { id: 'cards', name: 'لعبة ورق', emoji: '🎴', color: 'linear-gradient(135deg, #ff6b81, #ff9a3d)' },
]

export function getGame(id) {
  return games.find((g) => g.id === id) || null
}
