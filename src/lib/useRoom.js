// هوك يشترك في غرفة ويزامنها لحظياً، وينضم اللاعب تلقائياً لو فيه مقعد فاضي
import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
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
