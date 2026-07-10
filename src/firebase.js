// إعداد Firebase — القيم تُقرأ من ملف .env.local
// (شوف .env.example عشان تعرف كيف تعبّيها من إعدادات مشروعك في Firebase)
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// مهم: ما نهيّئ Firebase إلا لو الإعدادات موجودة، عشان التطبيق ما ينهار
// قبل ما تعبّي الإعدادات — الصفحة تفتح وتطلع لك رسالة توضّح كيف تربطه.
let db = null
let auth = null

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
} else {
  console.warn('⚠️ إعدادات Firebase ناقصة — عبّي ملف .env.local (شوف .env.example)')
}

export { db, auth }
