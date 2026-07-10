// سياق تسجيل الدخول — دخول تلقائي كضيف عشان اللاعب يلعب فوراً بدون تعقيد
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

// اسم اللاعب يُحفظ محلياً حتى يختار غيره
const NAME_KEY = 'anasah:name'
export function getSavedName() {
  return localStorage.getItem(NAME_KEY) || ''
}
export function saveName(name) {
  localStorage.setItem(NAME_KEY, name)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebase مو مهيّأ بعد؟ نوقف بدون دخول (الصفحة تشتغل وتطلع رسالة الإعداد)
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u)
        setLoading(false)
      } else {
        signInAnonymously(auth).catch((e) => {
          console.error('فشل الدخول كضيف:', e)
          setLoading(false)
        })
      }
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
