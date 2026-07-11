// واجهة لعبة الكلمة (Wordle عربي) — نمطا واضع/مخمّن و سباق
import { useState, useEffect, useCallback } from 'react'
import {
  MAX_GUESSES, WORD_LEN, isValidLength, scoreGuess, letterStatuses,
  chooseMode, setSecret, submitGuess,
} from './logic'
import { toLetters } from './words'
import './wordle.css'

const KEY_ROWS = [
  ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر'],
  ['ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف'],
  ['ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
]

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

  // المضيف لسا ما اختار النمط
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
      statuses={{}}
    />
  )
}

// ===== مرحلة اللعب =====
function Play({ state, seat, players, commit }) {
  const { mode, secret, guesses, done, winner } = state

  // أي لوح نعرض ومن يقدر يكتب
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
      <Grid guesses={myGuesses} secret={secret} draftEnabled={canType} commit={commit} seat={seat} mode={mode} />
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

// شبكة اللوح — الصفوف المقدّمة + صف المسودّة + صفوف فارغة
function Grid({ guesses, secret, draftEnabled, commit, seat, mode }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const currentRow = guesses.length

  const submit = useCallback(async () => {
    if (!draftEnabled || busy) return
    if (!isValidLength(draft)) {
      setError(`الكلمة لازم ${WORD_LEN} حروف`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await commit((s) => submitGuess(s, seat, draft))
      setDraft('')
    } catch (e) {
      setError('صار خطأ، جرّب مرة ثانية')
    } finally {
      setBusy(false)
    }
  }, [draft, draftEnabled, busy, commit, seat])

  const addLetter = useCallback((ch) => {
    if (!draftEnabled) return
    setError('')
    setDraft((d) => (d.length < WORD_LEN ? d + ch : d))
  }, [draftEnabled])

  const backspace = useCallback(() => {
    setError('')
    setDraft((d) => d.slice(0, -1))
  }, [])

  // دعم لوحة المفاتيح الفعلية
  useEffect(() => {
    if (!draftEnabled) return
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); submit() }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
      else if (/^[ء-ي]$/.test(e.key)) { addLetter(e.key) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draftEnabled, submit, backspace, addLetter])

  const statuses = letterStatuses(guesses, secret)

  return (
    <>
      <div className="wl-grid">
        {Array.from({ length: MAX_GUESSES }).map((_, r) => {
          const isCurrent = r === currentRow && draftEnabled
          const guess = r < guesses.length ? guesses[r] : null
          const score = guess ? scoreGuess(guess, secret) : null
          const letters = guess ? toLetters(guess) : (isCurrent ? draft.split('') : [])
          return (
            <div className="wl-row" key={r}>
              {Array.from({ length: WORD_LEN }).map((__, c) => (
                <div
                  key={c}
                  className={`wl-tile${score ? ' ' + score[c] : ''}${isCurrent && letters[c] ? ' filled' : ''}`}
                >
                  {letters[c] || ''}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {error && <div className="wl-error">{error}</div>}

      {draftEnabled && (
        <Keyboard statuses={statuses} onLetter={addLetter} onEnter={submit} onBack={backspace} busy={busy} />
      )}
    </>
  )
}

// كاتب مستقل يُستخدم لكتابة الكلمة السرية في الإعداد
function Typer({ title, onSubmit, statuses }) {
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
      <Keyboard statuses={statuses} onLetter={addLetter} onEnter={submit} onBack={backspace} busy={busy} />
    </div>
  )
}

function Keyboard({ statuses, onLetter, onEnter, onBack, busy }) {
  return (
    <div className="wl-keyboard">
      {KEY_ROWS.map((row, i) => (
        <div className="wl-krow" key={i}>
          {i === 2 && (
            <button className="wl-key wl-key-wide" onClick={onEnter} disabled={busy}>تأكيد</button>
          )}
          {row.map((ch) => (
            <button
              key={ch}
              className={`wl-key${statuses[ch] ? ' ' + statuses[ch] : ''}`}
              onClick={() => onLetter(ch)}
            >
              {ch}
            </button>
          ))}
          {i === 2 && (
            <button className="wl-key wl-key-wide" onClick={onBack}>⌫</button>
          )}
        </div>
      ))}
    </div>
  )
}
