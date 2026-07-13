// لوح تخمين Wordle مشترك — يستخدمه النمط الجماعي والفردي
// يدير المسودّة ولوحة المفاتيح والإدخال، وينادي onSubmit(word) عند تأكيد كلمة صالحة.
import { useState, useEffect, useCallback } from 'react'
import { MAX_GUESSES, WORD_LEN, isValidLength, scoreGuess, letterStatuses } from './logic'
import { toLetters } from './words'

const KEY_ROWS = [
  ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر'],
  ['ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف'],
  ['ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
]

export default function GuessBoard({ guesses, secret, active, onSubmit, maxGuesses = MAX_GUESSES }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const currentRow = guesses.length

  const submit = useCallback(async () => {
    if (!active || busy) return
    if (!isValidLength(draft)) {
      setError(`الكلمة لازم ${WORD_LEN} حروف`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit(draft)
      setDraft('')
    } catch (e) {
      setError('صار خطأ، جرّب مرة ثانية')
    } finally {
      setBusy(false)
    }
  }, [draft, active, busy, onSubmit])

  const addLetter = useCallback((ch) => {
    if (!active) return
    setError('')
    setDraft((d) => (d.length < WORD_LEN ? d + ch : d))
  }, [active])

  const backspace = useCallback(() => {
    setError('')
    setDraft((d) => d.slice(0, -1))
  }, [])

  // دعم لوحة المفاتيح الفعلية
  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); submit() }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
      else if (/^[ء-ي]$/.test(e.key)) { addLetter(e.key) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, submit, backspace, addLetter])

  const statuses = letterStatuses(guesses, secret)

  return (
    <>
      <div className="wl-grid">
        {Array.from({ length: maxGuesses }).map((_, r) => {
          const isCurrent = r === currentRow && active
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

      {active && (
        <Keyboard statuses={statuses} onLetter={addLetter} onEnter={submit} onBack={backspace} busy={busy} />
      )}
    </>
  )
}

export function Keyboard({ statuses, onLetter, onEnter, onBack, busy }) {
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
