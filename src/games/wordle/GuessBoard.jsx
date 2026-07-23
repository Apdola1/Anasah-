// لوح تخمين Wordle مشترك — يستخدمه النمط الجماعي والفردي
// يستخدم لوحة مفاتيح الجهاز عبر حقل إدخال حقيقي، والخانات تعرض الحروف وتلوّنها.
import { useState, useRef, useCallback } from 'react'
import { MAX_GUESSES, WORD_LEN, isValidLength, scoreGuess } from './logic'
import { toLetters } from './words'

// حروف عربية فقط (نتجاهل الأرقام والرموز)
const ARABIC_ONLY = /[ء-ي]/g

export default function GuessBoard({ guesses, secret, active, onSubmit, maxGuesses = MAX_GUESSES }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

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
      inputRef.current?.focus()
    }
  }, [draft, active, busy, onSubmit])

  const onChange = (e) => {
    const letters = (e.target.value.match(ARABIC_ONLY) || []).slice(0, WORD_LEN)
    setError('')
    setDraft(letters.join(''))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
  }

  const focusInput = () => inputRef.current?.focus()

  return (
    <>
      <div className="wl-grid" onClick={active ? focusInput : undefined}>
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
        <div className="wl-entry">
          <input
            ref={inputRef}
            className="input wl-input"
            value={draft}
            onChange={onChange}
            onKeyDown={onKeyDown}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="اكتب تخمينك"
            aria-label="اكتب تخمينك"
            autoFocus
          />
          <button className="btn btn-primary" onClick={submit} disabled={busy}>تأكيد</button>
        </div>
      )}
    </>
  )
}
