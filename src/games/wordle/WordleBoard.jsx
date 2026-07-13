// واجهة لعبة الكلمة (Wordle عربي) — نمطا واضع/مخمّن و سباق (جماعي)
import { useState, useEffect, useCallback } from 'react'
import { MAX_GUESSES, WORD_LEN, isValidLength, chooseMode, setSecret, submitGuess } from './logic'
import GuessBoard, { Keyboard } from './GuessBoard'
import './wordle.css'

export default function WordleBoard({ state, seat, players, commit }) {
  if (state.phase === 'setup') {
    return <Setup state={state} seat={seat} commit={commit} />
  }
  return <Play state={state} seat={seat} players={players} commit={commit} />
}

// ===== مرحلة الإعداد: اختيار النمط + كتابة الكلمة السرية =====
function Setup({ state, seat, commit }) {
  const isHost = seat === 0

  if (!isHost) {
    return (
      <div className="wl">
        <div className="wl-banner">صاحبك يجهّز اللعبة… ⏳</div>
      </div>
    )
  }

  if (state.mode === null) {
    return (
      <div className="wl">
        <div className="wl-banner active">اختر نمط اللعب</div>
        <div className="wl-modes">
          <button className="wl-mode" onClick={() => commit((s) => chooseMode(s, 'setter'))}>
            <span className="wl-mode-emoji">🕵️</span>
            <span className="wl-mode-name">واضع / مخمّن</span>
            <span className="wl-mode-desc">تكتب كلمة سرية وصاحبك يخمّنها</span>
          </button>
          <button className="wl-mode" onClick={() => commit((s) => chooseMode(s, 'race'))}>
            <span className="wl-mode-emoji">🏁</span>
            <span className="wl-mode-name">سباق</span>
            <span className="wl-mode-desc">كلمة عشوائية للاثنين، وأول من يحلها يفوز</span>
          </button>
        </div>
      </div>
    )
  }

  // نمط الواضع: المضيف يكتب الكلمة السرية
  return (
    <Typer
      title="اكتب كلمتك السرية (٥ حروف)"
      onSubmit={(word) => commit((s) => setSecret(s, word))}
    />
  )
}

// ===== مرحلة اللعب =====
function Play({ state, seat, players, commit }) {
  const { mode, secret, guesses, done, winner } = state

  const displaySeat = mode === 'setter' ? 1 : (seat === null ? 0 : seat)
  const myGuesses = guesses[displaySeat] || []
  const canType =
    winner === null &&
    seat !== null &&
    (mode === 'setter' ? seat === 1 : !done[seat]) &&
    myGuesses.length < MAX_GUESSES &&
    !(mode === 'setter' && done[1])

  return (
    <div className="wl">
      <PlayBanner state={state} seat={seat} players={players} />
      <GuessBoard
        guesses={myGuesses}
        secret={secret}
        active={canType}
        onSubmit={(word) => commit((s) => submitGuess(s, seat, word))}
      />
    </div>
  )
}

function PlayBanner({ state, seat, players }) {
  const { mode, secret, winner, done, guesses } = state
  let text
  let tone = ''

  if (winner === 'draw') {
    text = `تعادل! الكلمة كانت «${secret}» 🤝`
  } else if (winner !== null) {
    if (mode === 'setter') {
      if (winner === 1) {
        text = seat === 1 ? 'أحسنت! حليتها 🎉' : `صاحبك حلّها 👏`
        tone = seat === 1 ? 'good' : ''
      } else {
        text = seat === 0 ? `ما قدر يحلها! كلمتك «${secret}» 😎` : `ما قدرت! الكلمة «${secret}»`
        tone = seat === 0 ? 'good' : ''
      }
    } else {
      const iWon = winner === seat
      const name = players[winner]?.name || 'صاحبك'
      text = iWon ? 'فزت يا بطل! 🎉' : `فاز ${name} — الكلمة «${secret}»`
      tone = iWon ? 'good' : ''
    }
    return <div className={`wl-banner ${tone}`}>{text}</div>
  } else {
    if (mode === 'setter') {
      text = seat === 1 ? 'خمّن الكلمة السرية 🕵️' : 'أنت الواضع — تفرّج على تخمينات صاحبك 👀'
      tone = seat === 1 ? 'active' : ''
    } else {
      const oppSeat = seat === 0 ? 1 : 0
      const oppCount = (guesses[oppSeat] || []).length
      text = `سباق! خمّن قبل صاحبك 🏁  (صاحبك: ${oppCount}/${MAX_GUESSES})`
      tone = 'active'
    }
  }
  return <div className={`wl-banner ${tone}`}>{text}</div>
}

// كاتب مستقل يُستخدم لكتابة الكلمة السرية في الإعداد (إدخال مُقنّع)
function Typer({ title, onSubmit }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = useCallback(async () => {
    if (busy) return
    if (!isValidLength(draft)) { setError(`الكلمة لازم ${WORD_LEN} حروف`); return }
    setBusy(true); setError('')
    try { await onSubmit(draft) } catch { setError('صار خطأ، جرّب مرة ثانية'); setBusy(false) }
  }, [draft, busy, onSubmit])

  const addLetter = useCallback((ch) => { setError(''); setDraft((d) => (d.length < WORD_LEN ? d + ch : d)) }, [])
  const backspace = useCallback(() => { setError(''); setDraft((d) => d.slice(0, -1)) }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); submit() }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
      else if (/^[ء-ي]$/.test(e.key)) { addLetter(e.key) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit, backspace, addLetter])

  return (
    <div className="wl">
      <div className="wl-banner active">{title}</div>
      <div className="wl-grid">
        <div className="wl-row">
          {Array.from({ length: WORD_LEN }).map((_, c) => (
            <div key={c} className={`wl-tile secret${draft[c] ? ' filled' : ''}`}>
              {draft[c] ? '•' : ''}
            </div>
          ))}
        </div>
      </div>
      {error && <div className="wl-error">{error}</div>}
      <Keyboard statuses={{}} onLetter={addLetter} onEnter={submit} onBack={backspace} busy={busy} />
    </div>
  )
}
