// محرّك الغرف — إنشاء/انضمام/مزامنة عبر Firestore. مشترك بين كل الألعاب.
import {
  doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getGame } from '../games/registry'

// حروف واضحة (بدون O/0 و I/1 عشان ما تلخبط)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode(len = 4) {
  let s = ''
  for (let i = 0; i < len; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return s
}

const roomRef = (code) => doc(db, 'rooms', code)

// إنشاء غرفة جديدة — المنشئ يجلس في المقعد 0
export async function createRoom(gameId, uid, name) {
  const game = getGame(gameId)
  if (!game) throw new Error('لعبة غير معروفة')

  // نحاول أكواد لين نلقى واحد فاضي
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode()
    const ref = roomRef(code)
    const existing = await getDoc(ref)
    if (existing.exists()) continue

    // عدد المقاعد حسب أقصى لاعبين للعبة (يدعم الألعاب متعددة اللاعبين)
    const seats = Array(game.maxPlayers).fill(null)
    seats[0] = uid

    await setDoc(ref, {
      gameId,
      status: 'waiting',
      seats,
      players: {
        [uid]: { name: name || 'لاعب', seat: 0, joinedAt: Date.now() },
      },
      state: game.createInitialState(),
      createdAt: serverTimestamp(),
    })
    return code
  }
  throw new Error('ما قدرنا ننشئ كود، حاول مرة ثانية')
}

// الانضمام لغرفة — نستخدم transaction عشان ما يجلس لاعبين بنفس المقعد
export async function joinRoom(code, uid, name) {
  const ref = roomRef(code)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('الغرفة مو موجودة — تأكد من الكود')
    const room = snap.data()

    // موجود أصلاً؟ ما نسوي شي — نرجّع مقعده ولعبة الغرفة
    if (room.players?.[uid]) return { seat: room.players[uid].seat, gameId: room.gameId }

    const seats = room.seats.slice()
    const free = seats.indexOf(null)
    if (free === -1) throw new Error('الغرفة ممتلئة 🙈')

    seats[free] = uid
    const players = { ...room.players, [uid]: { name: name || 'لاعب', seat: free, joinedAt: Date.now() } }
    const full = seats.every((s) => s !== null)

    tx.update(ref, {
      seats,
      players,
      status: full ? 'playing' : 'waiting',
    })
    // نرجّع لعبة الغرفة عشان نوجّه اللاعب للّعبة الصحيحة (الكود موحّد لكل الألعاب)
    return { seat: free, gameId: room.gameId }
  })
}

// حفظ حركة (حالة اللعبة الجديدة) — استبدال كامل للحالة
export async function pushState(code, nextState) {
  await updateDoc(roomRef(code), { state: nextState })
}

// تحديث آمن للحالة عبر transaction — يقرأ آخر حالة ثم يطبّق updater عليها.
// يمنع ضياع التحديثات لو لاعبان كتبوا بنفس اللحظة (مثل نمط السباق).
// لو رجّع updater قيمة فارغة (null/undefined) نلغي التحديث.
export async function commitState(code, updater) {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef(code))
    if (!snap.exists()) throw new Error('الغرفة غير موجودة')
    const room = snap.data()
    const next = updater(room.state, room)
    if (next === null || next === undefined) return null
    tx.update(roomRef(code), { state: next })
    return next
  })
}

// إعادة اللعبة من جديد (نفس اللاعبين)
export async function restartGame(code, gameId) {
  const game = getGame(gameId)
  await updateDoc(roomRef(code), { state: game.createInitialState() })
}

export { roomRef }
