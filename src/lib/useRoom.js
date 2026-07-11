// هوك يشترك في غرفة ويزامنها لحظياً، وينضم اللاعب تلقائياً لو فيه مقعد فاضي
import { useEffect, useState } from 'react'
import { onSnapshot, getDocFromServer } from 'firebase/firestore'
import { roomRef, joinRoom } from './rooms'
import { useAuth } from './auth'
import { getSavedName } from './auth'

export function useRoom(code) {
  const { user } = useAuth()
  const [room, setRoom] = useState(undefined) // undefined=يحمّل، null=مو موجودة
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  // الاشتراك اللحظي في مستند الغرفة
  useEffect(() => {
    if (!code) return
    const unsub = onSnapshot(
      roomRef(code),
      (snap) => setRoom(snap.exists() ? snap.data() : null),
      (err) => setError(err.message),
    )
    return unsub
  }, [code])

  // لما يرجع اللاعب للتبويب (بعد قفل الجوال أو التنقّل لتطبيق ثاني)،
  // نجيب آخر حالة من الخادم فوراً بدل ما ننتظر إعادة اتصال البث.
  // يعالج مشكلة "حركة الخصم ما تظهر إلا بعد تحديث الصفحة" على الجوال.
  useEffect(() => {
    if (!code) return
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      getDocFromServer(roomRef(code))
        .then((snap) => { if (snap.exists()) setRoom(snap.data()) })
        .catch(() => {}) // لو أوفلاين، البث بيلحق لما يرجع الاتصال
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [code])

  // انضمام تلقائي لو اللاعب مو داخل الغرفة وفيه مكان
  useEffect(() => {
    if (!user || room === undefined || room === null) return
    if (room.players?.[user.uid]) return // داخل أصلاً
    if (joining) return
    const hasSpace = room.seats.some((s) => s === null)
    if (!hasSpace) return

    setJoining(true)
    joinRoom(code, user.uid, getSavedName())
      .catch((e) => setError(e.message))
      .finally(() => setJoining(false))
  }, [user, room, code, joining])

  const mySeat = user && room?.players?.[user.uid]?.seat
  const seat = mySeat === undefined || mySeat === null ? null : mySeat

  // خريطة اللاعبين حسب المقعد: players[0], players[1]
  const playersBySeat = {}
  if (room?.players) {
    for (const p of Object.values(room.players)) playersBySeat[p.seat] = p
  }

  return { room, seat, playersBySeat, error }
}
