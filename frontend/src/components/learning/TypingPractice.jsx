import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import useTypingExercise from '../../hooks/useTypingExercise'
import VirtualKeyboard from './VirtualKeyboard'
import FingerGuide from './FingerGuide'

export default function TypingPractice() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState('loading') // loading | learn | practice | saving | result | submit-failed
  const [idx, setIdx] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [results, setResults] = useState([])
  const [outcome, setOutcome] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const tokenRef = useRef(crypto.randomUUID())

  useEffect(() => {
    let alive = true
    setPhase('loading')
    setLoadError('')
    setLesson(null)
    setIdx(0)
    setAttempt(0)
    setResults([])
    setOutcome(null)
    tokenRef.current = crypto.randomUUID()
    api.getLesson(lessonId)
      .then((l) => {
        if (!alive) return
        setLesson(l)
        setPhase('learn')
      })
      .catch((err) => alive && setLoadError(err.message))
    return () => { alive = false }
  }, [lessonId])

  const exercises = lesson?.exercises || []
  const target = exercises[idx]?.target_text || ''

  async function submit(list) {
    setPhase('saving')
    setSubmitError('')
    const seconds = Math.max(1, list.reduce((s, r) => s + r.ms, 0) / 1000)
    try {
      const res = await api.submitAttempt(lessonId, {
        client_token: tokenRef.current,
        duration_seconds: seconds,
        exercises: list.map(({ position, typed, errors, total_keys }) => ({ position, typed, errors, total_keys })),
      })
      setOutcome(res)
      setPhase('result')
    } catch (err) {
      setSubmitError(err.message)
      setPhase('submit-failed')
    }
  }

  function handleDone(r) {
    const entry = { position: exercises[idx].position, typed: r.typed, errors: r.errors, total_keys: r.total, ms: r.ms }
    const next = [...results, entry]
    setResults(next)
    if (idx + 1 < exercises.length) setIdx(idx + 1)
    else submit(next)
  }

  const { typed, errors, total } = useTypingExercise({
    target,
    active: phase === 'practice',
    resetKey: `${attempt}-${idx}`,
    onDone: handleDone,
  })

  function retry() {
    tokenRef.current = crypto.randomUUID()
    setResults([])
    setOutcome(null)
    setIdx(0)
    setAttempt((a) => a + 1)
    setPhase('learn')
  }

  const guided = idx === 0
  const nextChar = phase === 'practice' ? target[typed.length] : null
  const liveAcc = total > 0 ? Math.round(((total - errors) / total) * 100) : 100

  function charClass(i) {
    if (i < typed.length) return typed[i] === target[i] ? 'tp-c ok' : 'tp-c bad'
    if (i === typed.length && phase === 'practice') return 'tp-c cur'
    return 'tp-c'
  }

  return (
    <div className="tp-root">
      <style>{`
        .tp-root { max-width: 900px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .tp-card { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 2px 10px rgba(79,70,229,0.06); }
        .tp-card h2 { margin: 0 0 6px; }
        .tp-muted { color: #64748b; font-size: 14px; margin: 0; }
        .tp-error { background: #fee2e2; color: #b91c1c; padding: 14px 18px; border-radius: 12px; }
        .tp-list { margin: 12px 0 18px; padding-left: 20px; color: #334155; line-height: 1.7; }
        .tp-btn { display: inline-block; border: 0; background: #3b6cf6; color: #fff; padding: 12px 22px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .tp-btn.soft { background: #eaf0ff; color: #3b6cf6; }
        .tp-btn:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }
        .tp-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .tp-badge { background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .tp-bar { height: 8px; background: #e5e7f5; border-radius: 99px; overflow: hidden; margin: 12px 0; }
        .tp-bar > div { height: 100%; background: #3b82f6; transition: width 0.2s; }
        .tp-text { font-family: Consolas, "Courier New", monospace; font-size: 26px; line-height: 2; background: #f8f9ff; border: 1px solid #e5e7f5; border-radius: 12px; padding: 16px 20px; margin: 12px 0; white-space: pre-wrap; word-break: break-word; }
        .tp-c { color: #94a3b8; }
        .tp-c.ok { color: #16a34a; }
        .tp-c.bad { color: #dc2626; background: #fee2e2; }
        .tp-c.cur { background: #c7d2fe; color: #1e1b4b; border-radius: 3px; }
        .tp-stats { display: flex; gap: 18px; font-size: 14px; color: #334155; margin-bottom: 10px; }
        .tp-result { text-align: center; }
        .tp-result .big { font-size: 44px; font-weight: 800; margin: 8px 0; }
        .tp-pass { color: #16a34a; }
        .tp-fail { color: #dc2626; }
        .tp-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
      `}</style>

      {loadError && (
        <div className="tp-error" role="alert">
          {loadError}
          <div style={{ marginTop: 10 }}>
            <Link to="/learning" className="tp-btn soft">← Dashboard</Link>{' '}
            <Link to="/test" className="tp-btn soft">Typing Test</Link>
          </div>
        </div>
      )}

      {phase === 'loading' && !loadError && <p className="tp-muted">Lesson load ho raha hai…</p>}

      {lesson && phase === 'learn' && (
        <div className="tp-card">
          <span className="tp-badge">{lesson.lesson_type}</span>
          <h2>{lesson.title}</h2>
          <p className="tp-muted">{lesson.objective}</p>
          <ul className="tp-list">
            <li>Is lesson mein {exercises.length} exercises hain. Pehli exercise mein keyboard guide karega, baaki mein bina guide ke type karna hai.</li>
            <li>Galat key par character laal ho jata hai. Backspace se theek kar sakte ho, par galti ginti mein rehti hai.</li>
            <li>Pass hone ke liye accuracy <b>{lesson.pass_accuracy}%</b> ya zyada chahiye. Speed ki zaroorat nahi.</li>
            <li>Haath home row par rakho aur screen dekho, keyboard nahi.</li>
          </ul>
          <button className="tp-btn" onClick={() => setPhase('practice')}>▶ Start Practice</button>
        </div>
      )}

      {lesson && phase === 'practice' && (
        <>
          <div className="tp-card">
            <div className="tp-head">
              <b>{lesson.title}</b>
              <span className="tp-badge">{guided ? 'Guided Practice' : 'Independent Practice'}</span>
            </div>
            <div className="tp-bar" aria-label="Exercise progress">
              <div style={{ width: `${(idx / exercises.length) * 100}%` }} />
            </div>
            <div className="tp-stats">
              <span>Exercise {idx + 1} / {exercises.length}</span>
              <span>Accuracy: {liveAcc}%</span>
              <span>Errors: {errors}</span>
            </div>
            <div className="tp-text" aria-label="Type this text">
              {[...target].map((ch, i) => (
                <span key={i} className={charClass(i)}>{ch}</span>
              ))}
            </div>
            {guided ? <FingerGuide char={nextChar} /> : <p className="tp-muted">Bina guide ke type karo. Pichli exercises se jo seekha use yaad karo.</p>}
          </div>
          <VirtualKeyboard highlightChar={guided ? nextChar : null} />
        </>
      )}

      {phase === 'saving' && <p className="tp-muted">Result save ho raha hai…</p>}

      {phase === 'submit-failed' && (
        <div className="tp-error" role="alert">
          Result save nahi hua: {submitError}
          <div style={{ marginTop: 10 }}>
            <button className="tp-btn" onClick={() => submit(results)}>Dobara try karo</button>
          </div>
        </div>
      )}

      {phase === 'result' && outcome && (
        <div className="tp-card tp-result">
          <h2 className={outcome.passed ? 'tp-pass' : 'tp-fail'}>
            {outcome.passed ? '✅ Lesson Passed!' : '🔁 Thoda aur practice karo'}
          </h2>
          <div className="big">{outcome.accuracy}%</div>
          <p className="tp-muted">
            Sahi characters: {outcome.correct_chars} • Galtiyan: {outcome.error_chars} • Pass accuracy: {lesson.pass_accuracy}%
          </p>
          <div className="tp-actions">
            <button className="tp-btn soft" onClick={retry}>↻ Retry</button>
            {outcome.passed && outcome.next_lesson_id && (
              <button className="tp-btn" onClick={() => navigate(`/learning/practice/${outcome.next_lesson_id}`)}>Next Lesson →</button>
            )}
            <Link to="/learning" className="tp-btn soft">Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  )
}