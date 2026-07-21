// واجهة لعبة الجغرافيا — متعددة اللاعبين (٢+)
// المراحل: lobby → secret (اختيار سري) → playing (أدوار تخمين) → over
import { useState, useEffect, useRef } from 'react'
import {
  MIN_TO_START, COUNTDOWN_MS, activeSeats, startGame, startCountdown, beginPlaying,
  chooseSecret, makeGuess, resetGame, updateSettings,
} from './logic'
import { sfx } from '../../lib/sound'
import { countryOf } from './countries'
import WorldMap from './WorldMap'
import './geo.css'

export default function GeoGame({ state, seat, players, commit, code }) {
  const seats = Object.keys(players).map(Number).sort((a, b) => a - b)
  const nameOf = (s) => players[s]?.name || `لاعب ${s + 1}`
  const isHost = seat === 0
  const ctx = { state, seat, seats, nameOf, isHost, commit, code }

  switch (state.phase) {
    case 'countdown': return <Countdown {...ctx} />
    case 'secret': return <SecretPhase {...ctx} />
    case 'playing': return <Playing {...ctx} />
    case 'over': return <GameOver {...ctx} />
    default: return <Lobby {...ctx} />
  }
}

// عدّ تنازلي ٣ ٢ ١ يظهر للجميع (مزامَن عبر countAt) — المضيف ينقل للمرحلة التالية
function Countdown({ state, isHost, commit }) {
  const start = state.countAt || Date.now()
  const [left, setLeft] = useState(Math.ceil((COUNTDOWN_MS - (Date.now() - start)) / 1000))

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil((COUNTDOWN_MS - (Date.now() - start)) / 1000)))
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [start])

  // نبضة صوت مع كل رقم في العدّاد
  const prevLeft = useRef(null)
  useEffect(() => {
    if (left !== prevLeft.current && left > 0) sfx.tick()
    prevLeft.current = left
  }, [left])

  useEffect(() => {
    if (!isHost) return
    const delay = Math.max(0, COUNTDOWN_MS - (Date.now() - start)) + 200
    const t = setTimeout(() => commit((s, room) => beginPlaying(s, activeSeats(room))), delay)
    return () => clearTimeout(t)
  }, [isHost, start, commit])

  return (
    <div className="geo geo-count-screen">
      {left > 0 && <div className="geo-count" key={left}>{left}</div>}
    </div>
  )
}

function Lobby({ state, seat, seats, nameOf, isHost, commit, code }) {
  const enough = seats.length >= MIN_TO_START
  const showArrows = state.settings?.showArrows !== false
  const start = () => commit((s, room) => startGame(s, activeSeats(room)))
  const toggleArrows = () => commit((s) => updateSettings(s, { showArrows: !showArrows }))
  return (
    <div className="geo">
      <div className="geo-emoji-big">🌍</div>
      <h2 className="geo-title">حصان طروادة</h2>
      <div className="geo-share">شارك الكود مع صاحبك:<div className="room-code">{code}</div></div>
      <Chips seats={seats} nameOf={nameOf} seat={seat} />
      <div className="geo-note">{seats.length} لاعبين — نحتاج {MIN_TO_START} على الأقل</div>

      {isHost && (
        <button className={`geo-switch${showArrows ? ' on' : ''}`} onClick={toggleArrows}>
          <span>أسهم الاتجاه نحو الدولة؟</span>
          <span className="geo-switch-knob" />
        </button>
      )}

      {isHost ? (
        <button className="btn btn-primary" disabled={!enough} onClick={start}>ابدأ اللعبة</button>
      ) : (
        <div className="notice">بانتظار بدء المضيف… ⏳</div>
      )}
    </div>
  )
}

function SecretPhase({ state, seat, seats, isHost, commit }) {
  const mySecret = seat !== null ? state.secrets[seat] : undefined
  const pick = (iso) => commit((s) => chooseSecret(s, seat, iso))
  const chosenCount = seats.filter((s) => state.secrets[s] !== undefined).length
  const everyoneChose = chosenCount === seats.length
  const begin = () => commit((s, room) => startCountdown(s, activeSeats(room)))

  if (seat === null) {
    return <div className="geo"><h2 className="geo-title">👀 متفرّج</h2><div className="geo-note">اللاعبون يختارون دولهم السرية…</div></div>
  }

  return (
    <div className="geo">
      <h2 className="geo-title">اختر دولتك السرية 🤫</h2>
      <div className="geo-note">
        {mySecret ? <>اخترت: <b className="geo-hl">{countryOf(mySecret)?.ar}</b> — تقدر تغيّرها بالضغط على دولة ثانية</> : 'اضغط على دولة في الخريطة (كبّر عشان تختار بدقة)'}
      </div>
      <WorldMap onPick={pick} selectable pinIso={mySecret || null} />
      <div className="geo-progress">اختار {chosenCount}/{seats.length}</div>
      {isHost ? (
        <button className="btn btn-primary" disabled={!everyoneChose} onClick={begin}>
          {everyoneChose ? 'بدء اللعبة 🚀' : 'بانتظار اختيار الجميع…'}
        </button>
      ) : (
        <div className="notice">{everyoneChose ? 'بانتظار بدء المضيف… ⏳' : (mySecret ? 'بانتظار البقية…' : 'دورك — اختر دولتك')}</div>
      )}
    </div>
  )
}

function Playing({ state, seat, seats, nameOf, commit }) {
  const [pending, setPending] = useState(null)
  const myTurn = state.turn === seat
  const mySecret = seat !== null ? state.secrets[seat] : undefined
  const myGuesses = seat !== null ? (state.guesses[seat] || []) : []
  const guessedIsos = myGuesses.map((g) => g.iso)
  const showArrows = state.settings?.showArrows !== false
  const opponents = seats.filter((s) => s !== seat)

  // صوت انطلاق اللعب مرة واحدة، وصوت تنبيه كل ما يجي دورك
  const started = useRef(false)
  useEffect(() => { if (!started.current) { started.current = true; sfx.go() } }, [])
  useEffect(() => { if (myTurn) sfx.turn() }, [myTurn])

  const confirmGuess = () => {
    const iso = pending
    setPending(null)
    commit((s, room) => makeGuess(s, seat, iso, activeSeats(room)))
  }

  return (
    <div className="geo">
      <div className={`geo-turn${myTurn ? ' mine' : ''}`}>
        {myTurn ? '🎯 دورك — خمّن دولة خصمك!' : `⏳ دور ${nameOf(state.turn)}`}
      </div>

      {mySecret && (
        <div className="geo-secret-label">🔒 دولتك السرية: <b className="geo-hl">{countryOf(mySecret)?.ar}</b></div>
      )}

      <WorldMap
        guesses={myGuesses}
        onPick={myTurn ? setPending : undefined}
        selectable={myTurn}
        pinIso={mySecret || null}
        pendingIso={pending}
        disabledIsos={guessedIsos}
        showArrows={showArrows}
      />

      {myTurn && pending && (
        <div className="geo-confirm">
          <span>خمّنت: <b className="geo-hl">{countryOf(pending)?.ar}</b></span>
          <div className="geo-confirm-btns">
            <button className="btn btn-primary" onClick={confirmGuess}>تأكيد ✓</button>
            <button className="btn" onClick={() => setPending(null)}>إلغاء</button>
          </div>
        </div>
      )}
      {myTurn && !pending && <div className="geo-note">اضغط على دولة في الخريطة لتخمينها</div>}

      <div className="geo-guesses">
        <div className="geo-guesses-title">تخميناتك ({myGuesses.length})</div>
        {myGuesses.length === 0 ? (
          <span className="muted">ابدأ التخمين لتشوف المسافة{showArrows ? ' والاتجاه' : ''}</span>
        ) : (
          [...myGuesses].reverse().map((g, i) => <GuessRow key={i} g={g} showArrows={showArrows} />)
        )}
      </div>

      {/* سباق الخصوم: آخر تخمين لكل خصم ومدى اقترابه من هدفه */}
      <div className="geo-rivals">
        <div className="geo-guesses-title">سباق الخصوم 🐴</div>
        {opponents.map((s) => {
          const gs = state.guesses[s] || []
          const last = gs.length ? gs[gs.length - 1] : null
          return <RivalRow key={s} name={nameOf(s)} last={last} count={gs.length} isTurn={state.turn === s} />
        })}
      </div>

      <Chips seats={seats} nameOf={nameOf} seat={seat} active={state.turn} />
    </div>
  )
}

const HEAT_EMOJI = { hit: '🎯', hot: '🔥', warm: '🟠', cool: '🔵', cold: '🧊' }

function GuessRow({ g, showArrows = true }) {
  const c = countryOf(g.iso)
  return (
    <div className={`geo-guess-row${g.hit ? ' hit' : ''}`}>
      <b className="geo-guess-name">{c?.ar}</b>
      {g.hit ? (
        <span className="geo-guess-hit">🎯 إصابة!</span>
      ) : (
        <>
          <span className="geo-guess-km">{g.km.toLocaleString('en-US')} كم</span>
          {showArrows && (
            <svg className="geo-guess-arrow" viewBox="-8 -18 16 20" width="16" height="18" style={{ transform: `rotate(${g.bearing}deg)` }} aria-hidden="true">
              <path d="M0,-16 L4,-7 L1,-7 L1,0 L-1,0 L-1,-7 L-4,-7 Z" fill="currentColor" />
            </svg>
          )}
          <span className="geo-guess-heat">{HEAT_EMOJI[g.heat]}</span>
        </>
      )}
    </div>
  )
}

// صف خصم في «سباق الخصوم»: اسمه، آخر دولة خمّنها، ومدى حرارته (قربه من صيد أحد)
function RivalRow({ name, last, count, isTurn }) {
  return (
    <div className={`geo-rival-row${last?.hit ? ' hit' : ''}${isTurn ? ' turn' : ''}`}>
      <b className="geo-rival-name">{name}{isTurn ? ' 🎯' : ''}</b>
      {!last ? (
        <span className="muted">لم يخمّن بعد</span>
      ) : last.hit ? (
        <span className="geo-guess-hit">🎯 صاد دولة!</span>
      ) : (
        <>
          <span className="geo-rival-guess">{countryOf(last.iso)?.ar}</span>
          <span className="geo-guess-km">{last.km.toLocaleString('en-US')} كم</span>
          <span className="geo-guess-heat">{HEAT_EMOJI[last.heat]}</span>
          <span className="muted geo-rival-count">({count})</span>
        </>
      )}
    </div>
  )
}

function GameOver({ state, seat, seats, nameOf, isHost, commit }) {
  const iWon = state.winner === seat
  const mySecret = seat !== null ? state.secrets[seat] : null
  const reset = () => commit((s) => resetGame(s))

  useEffect(() => { if (iWon) sfx.win(); else sfx.lose() }, [iWon])

  return (
    <div className="geo">
      <div className={`geo-verdict ${iWon ? 'good' : 'bad'}`}>
        {iWon ? '🏆 فزت! صدت دولة خصمك' : `🏁 فاز ${nameOf(state.winner)}`}
      </div>
      <WorldMap
        guesses={seat !== null ? (state.guesses[seat] || []) : []}
        selectable={false}
        pinIso={mySecret}
      />
      <div className="geo-reveal">
        <div className="geo-reveal-title">الدول السرية:</div>
        {seats.map((s) => (
          <div key={s} className="geo-reveal-row">
            <b>{nameOf(s)}</b>
            <span className="muted"> اختار </span>
            {countryOf(state.secrets[s])?.ar || '—'}
          </div>
        ))}
      </div>
      {isHost && <button className="btn btn-primary" onClick={reset}>لعبة جديدة 🔁</button>}
    </div>
  )
}

function Chips({ seats, nameOf, seat, active }) {
  return (
    <div className="geo-players">
      {seats.map((s) => (
        <span key={s} className={`geo-chip${active === s ? ' active' : ''}`}>
          {nameOf(s)}{s === seat ? ' (أنت)' : ''}
        </span>
      ))}
    </div>
  )
}
