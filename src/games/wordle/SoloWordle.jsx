// النمط الفردي: كلمة اليوم (Wordle كلاسيكي) — بدون غرفة ولا تسجيل دخول
import { useState } from 'react'
import { MAX_GUESSES, isSolved } from './logic'
import GuessBoard from './GuessBoard'
import { dailyWord, loadTodayGuesses, saveTodayGuesses } from './daily'
import './wordle.css'

export default function SoloWordle() {
  const secret = dailyWord()
  const [guesses, setGuesses] = useState(() => loadTodayGuesses())

  const solved = guesses.length > 0 && isSolved(guesses[guesses.length - 1], secret)
  const outOfTries = guesses.length >= MAX_GUESSES && !solved
  const done = solved || outOfTries

  const submit = (word) => {
    const next = [...guesses, word]
    setGuesses(next)
    saveTodayGuesses(next)
  }

  return (
    <div className="wl">
      <Banner solved={solved} outOfTries={outOfTries} count={guesses.length} secret={secret} />
      <GuessBoard guesses={guesses} secret={secret} active={!done} onSubmit={submit} />
      {done && <div className="notice">ارجع بكرة لكلمة جديدة 🗓️</div>}
    </div>
  )
}

function Banner({ solved, outOfTries, count, secret }) {
  if (solved) {
    return <div className="wl-banner good">أحسنت! حليتها في {count}/{MAX_GUESSES} 🎉</div>
  }
  if (outOfTries) {
    return <div className="wl-banner">خلصت المحاولات! الكلمة: «{secret}»</div>
  }
  return <div className="wl-banner active">كلمة اليوم 🗓️</div>
}
