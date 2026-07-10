# أناسة · Anasah 🎲

منصة ألعاب أونلاين للعب مع الأصحاب — ونس ومتعة. مبنية على **React + Vite + Firebase**.

المنصة مصمّمة لتحمل **أكثر من لعبة**: كل لعبة "قطعة" مستقلة تُركّب على أساس مشترك (تسجيل دخول + غرف + مزامنة لحظية).

## الألعاب

- ⭕️ **إكس أو** — جاهزة
- 🔵 أربعة على التوالي · 🔤 خمّن الكلمة · 🎴 لعبة ورق — قادمة

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ثم عبّي إعدادات Firebase
npm run dev
```

> بدون إعدادات Firebase، الموقع يفتح بس الجزء الأونلاين معطّل (تطلع رسالة توضيحية).

## ربط Firebase

1. أنشئ مشروع في [Firebase Console](https://console.firebase.google.com).
2. فعّل **Authentication → Anonymous**.
3. فعّل **Firestore Database**.
4. من ⚙️ *Project settings → Your apps (Web)* انسخ قيم الإعداد وحطها في `.env.local`.

## النشر

```bash
npm run build
firebase deploy               # يرفع القواعد + الاستضافة
```

## إضافة لعبة جديدة

1. أنشئ مجلد تحت `src/games/<اللعبة>/` فيه:
   - `logic.js` — منطق اللعبة (دوال صافية)
   - `<Game>.jsx` — الواجهة (تستقبل `state, seat, players, onMove`)
   - `index.js` — تعريف اللعبة (id, name, emoji, createInitialState, Component)
2. أضِف اللعبة في `src/games/registry.js`.

خلاص — تطلع في المعرض وتشتغل عليها الغرف والمزامنة تلقائياً.

## البنية

```
src/
  firebase.js        تهيئة Firebase (تتحمّل غياب الإعدادات بدون انهيار)
  lib/
    auth.jsx         دخول تلقائي كضيف
    rooms.js         إنشاء/انضمام/مزامنة الغرف
    useRoom.js       هوك يشترك في غرفة لحظياً
  games/
    registry.js      سجل الألعاب — قلب المنصة
    xo/              أول لعبة
  pages/
    Home.jsx         معرض الألعاب
    GameLobby.jsx    إنشاء/دخول غرفة
    GameRoom.jsx     اللعب
```
