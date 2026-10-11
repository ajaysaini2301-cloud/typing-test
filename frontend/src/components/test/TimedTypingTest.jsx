import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'

const DURATIONS = [15, 30, 60, 120]
const CATEGORIES = ['random', 'easy', 'medium', 'hard']

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function SpeedChart({ data }) {
  if (data.length === 0) {
    return <p className="tt-muted">Abhi koi data nahi. Test do aur graph dekho.</p>
  }
  const W = 420, H = 170, P = 28
  const top = Math.max(20, Math.ceil(Math.max(...data.map((d) => d.best_wpm)) / 20) * 20)
  const x = (i) => (data.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (data.length - 1))
  const y = (v) => H - P - (v / top) * (H - 2 * P)
  const points = data.map((d, i) => `${x(i)},${y(d.best_wpm)}`).join(' ')
  const area = `${x(0)},${H - P} ${points} ${x(data.length - 1)},${H - P}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P} x2={W - P} y1={y(top * f)} y2={y(top * f)} stroke="#eef0f8" />
          <text x={4} y={y(top * f) + 4} className="tt-chart-label">{Math.round(top * f)}</text>
        </g>
      ))}
      <polygon points={area} fill="#6366f1" opacity="0.12" />
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2.5" />
      {data.map((d, i) => (
        <g key={d.day}>
          <circle cx={x(i)} cy={y(d.best_wpm)} r="4" fill="#6366f1" />
          <text x={x(i)} y={H - 8} textAnchor="middle" className="tt-chart-label">{d.day.slice(5)}</text>
        </g>
      ))}
    </svg>
  )
}

export default function TimedTypingTest() {
  const [duration, setDuration] = useState(60)
  const [category, setCategory] = useState('random')
  const [passage, setPassage] = useState('')
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('idle') // idle | running | finished
  const [timeLeft, setTimeLeft] = useState(60)
  const [errors, setErrors] = useState(0)
  const [totalKeys, setTotalKeys] = useState(0)
  const [result, setResult] = useState(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ total_tests: 0, best_wpm: 0, best_accuracy: 0, avg_wpm: 0 })
  const [progress, setProgress] = useState([])
  const [loadError, setLoadError] = useState('')
  const inputRef = useRef(null)
  const submittedRef = useRef(false)

  const correctChars = [...typed].filter((ch, i) => ch === passage[i]).length
  const elapsed = duration - timeLeft
  const liveWpm = elapsed > 0 ? Math.round(correctChars / 5 / (elapsed / 60)) : 0
  const liveAccuracy = totalKeys > 0 ? Math.round(((totalKeys - errors) / totalKeys) * 100) : 0

  async function loadPassage(cat = category) {
    try {
      setLoadError('')
      const data = await api.getPassage(cat)
      setPassage(data.passage)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  async function loadDashboard() {
    try {
      const [r, s] = await Promise.all([api.getResults(), api.getStats()])
      setHistory(r.results || [])
      if (s.stats) setStats(s.stats)
      setProgress(s.progress || [])
    } catch (err) {
      setLoadError(err.message)
    }
  }

  useEffect(() => {
    loadPassage('random')
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [status])

  useEffect(() => {
    if (status !== 'running') return
    if (timeLeft === 0 || (passage && typed.length === passage.length)) finishTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, typed, status])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' && status === 'idle' && passage) {
        e.preventDefault()
        startTest()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, passage, duration])

  async function finishTest() {
    if (submittedRef.current) return // duplicate save rokta hai
    submittedRef.current = true
    setStatus('finished')

    const seconds = Math.max(1, duration - timeLeft)
    const wpm = Math.round(correctChars / 5 / (seconds / 60))
    const accuracy = totalKeys > 0 ? Math.round(((totalKeys - errors) / totalKeys) * 10000) / 100 : 0
    const finalResult = { wpm, accuracy, errors, duration_seconds: seconds, category }
    setResult(finalResult)

    try {
      setSaveMsg('Result save ho raha hai...')
      await api.saveResult(finalResult)
      setSaveMsg('Result save ho gaya ✅')
      loadDashboard()
    } catch (err) {
      setSaveMsg(`Result save nahi hua ❌ (${err.message})`)
    }
  }

  function resetState(newDuration = duration) {
    setTyped('')
    setErrors(0)
    setTotalKeys(0)
    setTimeLeft(newDuration)
    setResult(null)
    setSaveMsg('')
    submittedRef.current = false
  }

  function startTest() {
    resetState()
    setStatus('running')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function restartTest() {
    setStatus('idle')
    resetState()
    await loadPassage()
  }

  function chooseDuration(d) {
    if (status === 'running') return
    setDuration(d)
    setStatus('idle')
    resetState(d)
  }

  async function chooseCategory(c) {
    if (status === 'running') return
    setCategory(c)
    setStatus('idle')
    resetState()
    await loadPassage(c)
  }

  function handleChange(e) {
    if (status !== 'running') return
    const value = e.target.value
    if (value.length > passage.length) return
    if (value.length > typed.length) {
      let newErrors = 0
      for (let i = typed.length; i < value.length; i++) {
        if (value[i] !== passage[i]) newErrors++
      }
      setTotalKeys((k) => k + (value.length - typed.length))
      setErrors((er) => er + newErrors)
    }
    setTyped(value)
  }

  function charClass(i) {
    if (i < typed.length) return typed[i] === passage[i] ? 'tt-char tt-correct' : 'tt-char tt-wrong'
    if (i === typed.length && status === 'running') return 'tt-char tt-current'
    return 'tt-char'
  }

  const bestThisWeek = progress.length ? Math.max(...progress.map((p) => p.best_wpm)) : 0
  const lastWpm = history.length ? history[0].wpm : 0

  return (
    <div className="tt-content">
      <style>{`
        .tt-content { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; padding: 20px 24px; }
        .tt-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .tt-card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(79,70,229,0.06); }
        .tt-card h3 { margin: 0 0 14px; font-size: 18px; }
        .tt-muted { color: #64748b; font-size: 13px; }
        .tt-hero { background: linear-gradient(120deg, #bae6fd, #c7d2fe); border-radius: 16px; padding: 24px; }
        .tt-hero h1 { margin: 0 0 16px; font-size: 28px; }
        .tt-hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .tt-hero-stat { background: #fff; border-radius: 12px; padding: 14px; }
        .tt-hero-stat strong { display: block; font-size: 22px; }
        .tt-hero-stat span { font-size: 12px; color: #64748b; }
        .tt-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .tt-head h3 { margin: 0; }
        .tt-meta { font-size: 13px; color: #475569; display: flex; gap: 18px; text-transform: capitalize; }
        .tt-passage { background: #f8f9ff; border: 1px solid #e5e7f5; border-radius: 12px; padding: 18px; font-size: 19px; line-height: 1.8; font-family: Consolas, "Courier New", monospace; margin-bottom: 12px; color: #475569; }
        .tt-correct { color: #16a34a; }
        .tt-wrong { color: #dc2626; background: #fee2e2; }
        .tt-current { background: #c7d2fe; color: #1e1b4b; }
        .tt-input { width: 100%; height: 80px; border: 2px solid #c7d2fe; border-radius: 12px; padding: 12px; font-size: 17px; font-family: Consolas, "Courier New", monospace; resize: none; color: #1e1b4b; background: #fff; box-sizing: border-box; }
        .tt-input:focus { outline: none; border-color: #4f46e5; }
        .tt-btn { width: 100%; margin-top: 12px; background: linear-gradient(90deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 12px; padding: 14px 20px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .tt-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .tt-btn small { font-weight: 400; opacity: 0.85; }
        .tt-result { margin-top: 12px; background: #eef0ff; border-radius: 12px; padding: 14px; text-align: center; }
        .tt-result p { margin: 4px 0; }
        .tt-table-wrap { overflow-x: auto; }
        .tt-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .tt-table th { background: #f1f3ff; color: #475569; text-align: left; padding: 10px; }
        .tt-table td { padding: 12px 10px; border-bottom: 1px solid #eef0f8; }
        .tt-wpm { color: #4f46e5; font-weight: 700; }
        .tt-acc { color: #16a34a; font-weight: 700; }
        .tt-badge { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: capitalize; background: #ede9fe; color: #6d28d9; }
        .tt-badge.easy { background: #dcfce7; color: #15803d; }
        .tt-badge.medium { background: #fef3c7; color: #b45309; }
        .tt-badge.hard { background: #fee2e2; color: #b91c1c; }
        .tt-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .tt-chip { flex: 1; min-width: 60px; padding: 10px 6px; border: 1px solid #e5e7f5; background: #f8f9ff; border-radius: 10px; text-align: center; cursor: pointer; font-size: 13px; color: #475569; text-transform: capitalize; }
        .tt-chip strong { display: block; font-size: 18px; color: #1e1b4b; }
        .tt-chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
        .tt-chip.active strong { color: #fff; }
        .tt-chip:disabled { opacity: 0.5; cursor: not-allowed; }
        .tt-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .tt-title-row h3 { margin: 0; }
        .tt-reset { border: 1px solid #e5e7f5; background: #f8f9ff; color: #4f46e5; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
        .tt-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .tt-item { border: 1px solid #eef0f8; background: #f8f9ff; border-radius: 12px; padding: 12px; }
        .tt-item strong { font-size: 22px; display: block; }
        .tt-item span { font-size: 12px; color: #64748b; }
        .tt-chart-label { font-size: 11px; fill: #94a3b8; }
        @media (max-width: 1100px) { .tt-content { grid-template-columns: 1fr; } }
        @media (max-width: 800px) { .tt-hero-stats { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="tt-col">
        <section className="tt-hero">
          <h1>Typing Test</h1>
          <div className="tt-hero-stats">
            <div className="tt-hero-stat"><strong>{stats.best_wpm}</strong><span>Best WPM</span></div>
            <div className="tt-hero-stat"><strong>{stats.best_accuracy}%</strong><span>Best Accuracy</span></div>
            <div className="tt-hero-stat"><strong>{stats.total_tests}</strong><span>Tests Completed</span></div>
            <div className="tt-hero-stat"><strong>{stats.avg_wpm}</strong><span>Average WPM</span></div>
          </div>
        </section>

        <section className="tt-card">
          <div className="tt-head">
            <h3>📝 Timed Test</h3>
            <div className="tt-meta">
              <span>⏱ Time: {duration}s</span>
              <span>📶 Difficulty: {category}</span>
            </div>
          </div>

          {loadError && <p className="tt-muted">{loadError}</p>}

          <div className="tt-passage">
            {[...passage].map((ch, i) => (
              <span key={i} className={charClass(i)}>{ch}</span>
            ))}
          </div>

          <textarea
            ref={inputRef}
            className="tt-input"
            value={typed}
            onChange={handleChange}
            onPaste={(e) => e.preventDefault()}
            readOnly={status !== 'running'}
            placeholder="Start typing here..."
            spellCheck={false}
          />

          {status === 'idle' && (
            <button className="tt-btn" onClick={startTest} disabled={!passage}>
              <span>▶ Start Test</span>
              <small>Press Enter to start</small>
            </button>
          )}

          {status === 'finished' && result && (
            <div className="tt-result">
              <p>
                WPM: <strong>{result.wpm}</strong> | Accuracy: <strong>{result.accuracy}%</strong> |
                Errors: <strong>{result.errors}</strong> | Time: <strong>{result.duration_seconds}s</strong>
              </p>
              <p className="tt-muted">{saveMsg}</p>
              <button className="tt-btn" onClick={restartTest}>
                <span>🔁 Try Again</span>
                <small>New passage</small>
              </button>
            </div>
          )}
        </section>

        <section className="tt-card">
          <h3>🕘 Recent Test Results</h3>
          <div className="tt-table-wrap">
            <table className="tt-table">
              <thead>
                <tr><th>#</th><th>Date &amp; Time</th><th>Duration</th><th>WPM</th><th>Accuracy</th><th>Errors</th><th>Category</th></tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>{r.duration_seconds}s</td>
                    <td className="tt-wpm">{r.wpm}</td>
                    <td className="tt-acc">{r.accuracy}%</td>
                    <td>{r.errors}</td>
                    <td><span className={`tt-badge ${r.category}`}>{r.category}</span></td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan="7" className="tt-muted">Abhi koi result nahi hai.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="tt-col">
        <section className="tt-card">
          <h3>Select Test Duration</h3>
          <div className="tt-chips">
            {DURATIONS.map((d) => (
              <button key={d} className={`tt-chip ${duration === d ? 'active' : ''}`}
                onClick={() => chooseDuration(d)} disabled={status === 'running'}>
                <strong>{d}</strong>Seconds
              </button>
            ))}
          </div>
          <h3>Select Category</h3>
          <div className="tt-chips" style={{ marginBottom: 0 }}>
            {CATEGORIES.map((c) => (
              <button key={c} className={`tt-chip ${category === c ? 'active' : ''}`}
                onClick={() => chooseCategory(c)} disabled={status === 'running'}>
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="tt-card">
          <div className="tt-title-row">
            <h3>📈 Live Stats</h3>
            <button className="tt-reset" onClick={restartTest}>↻ Reset</button>
          </div>
          <div className="tt-grid2">
            <div className="tt-item"><strong>{liveWpm}</strong><span>WPM</span></div>
            <div className="tt-item"><strong>{liveAccuracy}%</strong><span>Accuracy</span></div>
            <div className="tt-item"><strong>{typed.length}</strong><span>Characters Typed</span></div>
            <div className="tt-item"><strong>{timeLeft}s</strong><span>Time Left</span></div>
          </div>
        </section>

        <section className="tt-card">
          <h3>📊 Speed Progress (Last 7 Days)</h3>
          <SpeedChart data={progress} />
          <div className="tt-grid2" style={{ marginTop: 12 }}>
            <div className="tt-item"><strong>{bestThisWeek} WPM</strong><span>Best this week</span></div>
            <div className="tt-item"><strong>{lastWpm} WPM</strong><span>Last test</span></div>
          </div>
        </section>
      </div>
    </div>
  )
}