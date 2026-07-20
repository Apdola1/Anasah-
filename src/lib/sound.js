// مولّد أصوات بسيط عبر Web Audio (بدون ملفات) — لتنبيه اللاعبين عند تغيّر المراحل.
// يُفكّ القفل تلقائياً عند أول تفاعل من المستخدم (سياسة التشغيل التلقائي في المتصفحات).
let ctx = null

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// فكّ قفل الصوت عند أول لمسة/ضغطة (مطلوب في iOS وغيره)
if (typeof window !== 'undefined') {
  const unlock = () => {
    ac()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

// نغمة واحدة: تردد، بداية (ثانية)، مدة، نوع الموجة، أقصى ارتفاع
function tone(freq, start, dur, { type = 'sine', gain = 0.2 } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

export const sfx = {
  // نبضة العدّ التنازلي
  tick() { tone(660, 0, 0.12, { type: 'triangle', gain: 0.16 }) },
  // انطلاق اللعب (أقوى لشدّ الانتباه)
  go() { tone(784, 0, 0.16, { type: 'square', gain: 0.15 }); tone(1047, 0.13, 0.3, { type: 'square', gain: 0.15 }) },
  // جاء دورك
  turn() { tone(880, 0, 0.12, { type: 'sine', gain: 0.18 }); tone(1175, 0.1, 0.2, { type: 'sine', gain: 0.18 }) },
  // فوز — لحن صاعد
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.28, { type: 'triangle', gain: 0.18 })) },
  // خسارة — نغمة هابطة
  lose() { tone(392, 0, 0.22, { type: 'sine', gain: 0.16 }); tone(262, 0.16, 0.34, { type: 'sine', gain: 0.16 }) },
}
