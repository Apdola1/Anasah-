// واجهة لعبة الإمبوستر — متعددة اللاعبين (٣+)
import { useEffect, useRef, useState } from 'react'
import {
  MIN_TO_START, TIMER_PRESETS, activeSeats, startGame, startVoting, castVote,
  proceedToReveal, resetGame, updateSettings, whoVotedFor,
} from './logic'
import './impostor.css'

export default function ImpostorGame({ state, seat, players, commit, code }) {
  const seats = Object.keys(players).map(Number).sort((a, b) => a - b)
  const nameOf = (s) => players[s]?.name || `لاعب ${s + 1}`
  const isHost = seat === 0

  const ctx = { state, seat, seats, nameOf, isHost, commit, code }

  switch (state.phase) {
    case 'picking': return <Picking {...ctx} />
    case 'reveal': return <Reveal {...ctx} />
    case 'voting': return <Voting {...ctx} />
    case 'results': return <Results {...ctx} />
    default: return <Lobby {...ctx} />
  }
}

function Lobby({ state, seat, seats, nameOf, isHost, commit, code }) {
  const enough = seats.length >= MIN_TO_START
  const settings = state.settings || {}
  const start = () => commit((s, room) => startGame(s, activeSeats(room)))
  const setS = (patch) => commit((s) => updateSettings(s, patch))
  const isManual = settings.timerEnabled && !TIMER_PRESETS.includes(settings.timerSeconds)

  return (
    <div className="imp">
      <div className="imp-emoji-big">🥷</div>
      <h2 className="imp-title">الإمبوستر</h2>
      <div className="imp-share">
        شارك الكود مع صاحبك:
        <div className="room-code">{code}</div>
      </div>
      <PlayerChips seats={seats} nameOf={nameOf} seat={seat} />
      <div className="imp-note">{seats.length} لاعبين — نحتاج {MIN_TO_START} على الأقل</div>

      {isHost && (
        <div className="imp-settings">
          {/* المؤقّت */}
          <div className="imp-setting">
            <button
              className={`imp-switch${settings.timerEnabled ? ' on' : ''}`}
              onClick={() => setS({ timerEnabled: !settings.timerEnabled })}
            >
              <span className="imp-switch-label">نحتاج مؤقت؟</span>
              <span className="imp-switch-knob" />
            </button>
            {settings.timerEnabled && (
              <div className="imp-timer-opts">
                {TIMER_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    className={`imp-pill${settings.timerSeconds === sec ? ' chosen' : ''}`}
                    onClick={() => setS({ timerSeconds: sec })}
                  >
                    {sec === 60 ? 'دقيقة' : `${sec / 60} دقائق`}
                  </button>
                ))}
                <button
                  className={`imp-pill${isManual ? ' chosen' : ''}`}
                  onClick={() => setS({ timerSeconds: isManual ? settings.timerSeconds : 120 })}
                >
                  تحديد يدوي
                </button>
                {isManual && (
                  <div className="imp-manual">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={Math.round(settings.timerSeconds / 60)}
                      onChange={(e) => {
                        const m = Math.max(1, Math.min(60, Number(e.target.value) || 1))
                        setS({ timerSeconds: m * 60 })
                      }}
                    />
                    <span>دقيقة</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* اختيار من يبدأ */}
          <div className="imp-setting">
            <button
              className={`imp-switch${settings.pickStarter ? ' on' : ''}`}
              onClick={() => setS({ pickStarter: !settings.pickStarter })}
            >
              <span className="imp-switch-label">نختار مين يبدأ؟</span>
              <span className="imp-switch-knob" />
            </button>
          </div>
        </div>
      )}

      {isHost ? (
        <button className="btn btn-primary" disabled={!enough} onClick={start}>ابدأ اللعبة</button>
      ) : (
        <div className="notice">بانتظار بدء المضيف… ⏳</div>
      )}
    </div>
  )
}

// مشهد «مين يبدأ؟» — عجلة دوران تقف على اللاعب الذي اختِير عشوائياً
function Picking({ state, seats, nameOf, isHost, commit }) {
  const order = seats
  const landIdx = Math.max(0, order.indexOf(state.starterSeat))
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    // عدد الخطوات: عدة لفّات كاملة ثم التوقف على الفائز
    const loops = 3
    const totalSteps = loops * order.length + landIdx
    let step = 0
    const tick = () => {
      setIdx(step % order.length)
      if (step >= totalSteps) { setDone(true); return }
      const remaining = totalSteps - step
      // يتسارع ثم يتباطأ في آخر لفّة (تشويق)
      const delay = remaining <= 12 ? 90 + (12 - remaining) * 32 : 70
      step++
      timer.current = setTimeout(tick, delay)
    }
    tick()
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const next = () => commit((s) => proceedToReveal(s))

  return (
    <div className="imp">
      <h2 className="imp-title">مين يبدأ؟ 🎯</h2>
      <div className={`imp-wheel${done ? ' landed' : ''}`}>
        {done ? '🎯' : '🎰'} {nameOf(order[idx])}
      </div>
      {done ? (
        <div className="imp-starter-note">يبدأ الجولة: <b>{nameOf(state.starterSeat)}</b></div>
      ) : (
        <div className="imp-note">جاري الاختيار عشوائياً…</div>
      )}
      <PlayerChips seats={seats} nameOf={nameOf} seat={null} active={done ? state.starterSeat : order[idx]} />
      {isHost ? (
        <button className="btn btn-primary" disabled={!done} onClick={next}>اعرض الكلمات 👁️</button>
      ) : (
        <div className="notice">بانتظار المضيف… ⏳</div>
      )}
    </div>
  )
}

// عدّاد تنازلي لمؤقّت النقاش
function CountdownTimer({ endsAt }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const over = remaining === 0
  return (
    <div className={`imp-timer${over ? ' over' : ''}`}>
      {over ? '⏰ انتهى الوقت!' : `⏱️ ${mm}:${ss}`}
    </div>
  )
}

function Reveal({ state, seat, seats, nameOf, isHost, commit }) {
  const amImpostor = seat === state.impostorSeat
  const isSpectator = seat === null
  const startVote = () => commit((s) => startVoting(s))

  return (
    <div className="imp">
      {state.timerEndsAt && <CountdownTimer endsAt={state.timerEndsAt} />}

      {isSpectator ? (
        <div className="imp-role"><div className="imp-role-emoji">👀</div><div className="imp-role-title">أنت متفرّج</div></div>
      ) : amImpostor ? (
        <div className="imp-role impostor">
          <div className="imp-role-emoji">🥷</div>
          <div className="imp-role-title">أنت الإمبوستر</div>
          <div className="imp-hint">تلميح: {state.topic.hint}</div>
          <div className="imp-role-note">اندمج مع الجماعة… ولا ينكشف!</div>
        </div>
      ) : (
        <div className="imp-role crew">
          <div className="imp-role-label">الموضوع</div>
          <div className="imp-word">{state.topic.word}</div>
          <div className="imp-role-note">اوصفه بذكاء… لا تفضح الكلمة مباشرة!</div>
        </div>
      )}

      {state.starterSeat !== null && state.starterSeat !== undefined && (
        <div className="imp-note">يبدأ: <b>{nameOf(state.starterSeat)}</b></div>
      )}

      <PlayerChips seats={seats} nameOf={nameOf} seat={seat} />
      {isHost ? (
        <button className="btn btn-primary" onClick={startVote}>ابدأ التصويت 🗳️</button>
      ) : (
        <div className="notice">ناقشوا… ثم يبدأ المضيف التصويت</div>
      )}
    </div>
  )
}

function Voting({ state, seat, seats, nameOf, isHost, commit }) {
  const myVote = seat !== null ? state.votes[seat] : undefined
  const votedCount = Object.keys(state.votes).length
  const vote = (target) => commit((s, room) => castVote(s, seat, target, activeSeats(room)))
  const endVoting = () => commit((s) => ({ ...s, phase: 'results' }))

  return (
    <div className="imp">
      <h2 className="imp-title">مين الإمبوستر؟ 🗳️</h2>
      <div className="imp-note">صوّت على اللي تشك فيه</div>
      <div className="imp-vote-list">
        {seats.filter((s) => s !== seat).map((s) => (
          <button
            key={s}
            className={`imp-vote${myVote === s ? ' chosen' : ''}`}
            disabled={myVote !== undefined || seat === null}
            onClick={() => vote(s)}
          >
            {nameOf(s)}
          </button>
        ))}
      </div>
      <div className="imp-note">صوّت {votedCount}/{seats.length}</div>
      {isHost && (
        <button className="btn" onClick={endVoting}>أنهِ التصويت الآن</button>
      )}
    </div>
  )
}

function Results({ state, seat, seats, nameOf, isHost, commit }) {
  const voters = whoVotedFor(state.votes, state.impostorSeat)
  // نتيجة فردية: من صوّت على الإمبوستر «صدّه»، ومن لم يصوّت عليه «فلت منه».
  const myVote = seat !== null ? state.votes[seat] : undefined
  const iCaught = myVote !== undefined && myVote === state.impostorSeat
  const reset = () => commit((s) => resetGame(s))

  return (
    <div className="imp">
      <div className={`imp-verdict ${iCaught ? 'good' : 'bad'}`}>
        {iCaught ? 'صدت الإمبوستر يا فنان! 🎯' : 'الإمبوستر فلت! 🥷💨'}
      </div>

      <div className="imp-role impostor">
        <div className="imp-role-emoji">🥷</div>
        <div className="imp-role-title">الإمبوستر كان: {nameOf(state.impostorSeat)}</div>
        <div className="imp-hint">الموضوع كان: «{state.topic.word}»</div>
      </div>

      <div className="imp-section">
        <div className="imp-section-title">اللي صوّتوا عليه:</div>
        {voters.length ? (
          <PlayerChips seats={voters} nameOf={nameOf} seat={seat} />
        ) : (
          <span className="muted">ما صوّت عليه أحد 😅</span>
        )}
      </div>

      <div className="imp-section">
        <div className="imp-section-title">كل الأصوات:</div>
        {seats.map((s) => (
          <div key={s} className="imp-vote-row">
            <b>{nameOf(s)}</b>
            <span className="muted"> صوّت لـ </span>
            {state.votes[s] !== undefined ? nameOf(state.votes[s]) : '—'}
          </div>
        ))}
      </div>

      {isHost && <button className="btn btn-primary" onClick={reset}>لعبة جديدة 🔁</button>}
    </div>
  )
}

function PlayerChips({ seats, nameOf, seat, active }) {
  return (
    <div className="imp-players">
      {seats.map((s) => (
        <span key={s} className={`imp-chip${active === s ? ' active' : ''}`}>
          {nameOf(s)}{s === seat ? ' (أنت)' : ''}
        </span>
      ))}
    </div>
  )
}
