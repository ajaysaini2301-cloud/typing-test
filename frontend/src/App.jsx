import { useState, useEffect, useRef } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:5000/api'
const DURATIONS = [15, 30, 60, 120]
const CATEGORIES = ['random', 'easy', 'medium', 'hard']
const NAV = [
  ['🏠', 'Dashboard'],
  ['⌨️', 'Typing Test'],
  ['🎯', 'Practice'],
  ['🕘', 'Test History'],
  ['🏆', 'Leaderboard'],
  ['⭐', 'Achievements'],
  ['👤', 'Profile'],
  ['⚙️', 'Settings'],
]

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SpeedChart({ data }) {
  if (data.length === 0) {
    return <p className="muted">Abhi koi data nahi. Test do aur graph dekho.</p>
  }
  const W = 420
  const H = 170
  const P = 28
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
          <text x={4} y={y(top * f) + 4} className="chart-label">
            {Math.round(top * f)}
          </text>
        </g>
      ))}
      <polygon points={area} fill="#6366f1" opacity="0.12" />
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2.5" />
      {data.map((d, i) => (
        <g key={d.day}>
          <circle cx={x(i)} cy={y(d.best_wpm)} r="4" fill="#6366f1" />
          <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-label">
            {d.day.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function App() {
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
  const [stats, setStats] = useState({
    total_tests: 0,
    best_wpm: 0,
    best_accuracy: 0,
    avg_wpm: 0,
  })
  const [progress, setProgress] = useState([])
  const [loadError, setLoadError] = useState('')
  const inputRef = useRef(null)

  const correctChars = [...typed].filter((ch, i) => ch === passage[i]).length
  const elapsed = duration - timeLeft
  const liveWpm = elapsed > 0 ? Math.round(correctChars / 5 / (elapsed / 60)) : 0
  const liveAccuracy =
    totalKeys > 0 ? Math.round(((totalKeys - errors) / totalKeys) * 100) : 0

  async function loadPassage(cat = category) {
    try {
      setLoadError('')
      const res = await fetch(`${API_URL}/passage?category=${cat}`)
      const data = await res.json()
      setPassage(data.passage)
    } catch {
      setLoadError('Backend se passage nahi aaya. Flask server chal raha hai?')
    }
  }

  async function loadDashboard() {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/results`),
        fetch(`${API_URL}/stats`),
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      setHistory(d1.results || [])
      if (d2.stats) setStats(d2.stats)
      setProgress(d2.progress || [])
    } catch {
      // dashboard data optional hai
    }
  }

  useEffect(() => {
    loadPassage('random')
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  // Test khatam hone ka check
  useEffect(() => {
    if (status !== 'running') return
    if (timeLeft === 0 || (passage && typed.length === passage.length)) {
      finishTest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, typed, status])

  // Enter dabane par test start
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
    setStatus('finished')
    const seconds = Math.max(1, duration - timeLeft)
    const wpm = Math.round(correctChars / 5 / (seconds / 60))
    const accuracy =
      totalKeys > 0
        ? Math.round(((totalKeys - errors) / totalKeys) * 10000) / 100
        : 0
    const finalResult = { wpm, accuracy, errors, duration_seconds: seconds, category }
    setResult(finalResult)

    try {
      setSaveMsg('Result save ho raha hai...')
      const res = await fetch(`${API_URL}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalResult),
      })
      if (!res.ok) throw new Error('save failed')
      setSaveMsg('Result save ho gaya ✅')
      loadDashboard()
    } catch {
      setSaveMsg('Result save nahi hua ❌')
    }
  }

  function resetState(newDuration = duration) {
    setTyped('')
    setErrors(0)
    setTotalKeys(0)
    setTimeLeft(newDuration)
    setResult(null)
    setSaveMsg('')
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
    if (i < typed.length) {
      return typed[i] === passage[i] ? 'char correct' : 'char wrong'
    }
    if (i === typed.length && status === 'running') return 'char current'
    return 'char'
  }

  const bestThisWeek = progress.length ? Math.max(...progress.map((p) => p.best_wpm)) : 0
  const lastWpm = history.length ? history[0].wpm : 0

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">⌨️ Typing Test</div>
        {NAV.map(([icon, label], i) => (
          <div key={label} className={`nav-item ${i === 0 ? 'active' : ''}`}>
            <span>{icon}</span>
            {label}
          </div>
        ))}
        <div className="sidebar-card">
          👑
          <strong>Keep Practicing!</strong>
          Consistency makes you faster.
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <nav className="topnav">
            <span className="active">🏠 Home</span>
            <span>Practice</span>
            <span>Test</span>
            <span>Results</span>
            <span>Leaderboard</span>
            <span>Settings</span>
          </nav>
          <div className="user">
            <div className="avatar">A</div>
            Ajay Saini
          </div>
        </header>

        <div className="content">
          <div className="col">
            <section className="hero">
              <h1>Hi Ajay!</h1>
              <p>Improve your typing speed and accuracy with fun tests and practice.</p>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-icon" style={{ background: '#bbf7d0' }}>⚡</div>
                  <div>
                    <strong>{stats.best_wpm}</strong>
                    <span>Best WPM</span>
                  </div>
                </div>
                <div className="hero-stat">
                  <div className="hero-icon" style={{ background: '#ddd6fe' }}>🎯</div>
                  <div>
                    <strong>{stats.best_accuracy}%</strong>
                    <span>Best Accuracy</span>
                  </div>
                </div>
                <div className="hero-stat">
                  <div className="hero-icon" style={{ background: '#bfdbfe' }}>📊</div>
                  <div>
                    <strong>{stats.total_tests}</strong>
                    <span>Tests Completed</span>
                  </div>
                </div>
                <div className="hero-stat">
                  <div className="hero-icon" style={{ background: '#fed7aa' }}>🏆</div>
                  <div>
                    <strong>{stats.avg_wpm}</strong>
                    <span>Average WPM</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="typing-head">
                <h3>📝 Typing Test</h3>
                <div className="typing-meta">
                  <span>⏱ Time: {duration}s</span>
                  <span style={{ textTransform: 'capitalize' }}>📶 Difficulty: {category}</span>
                </div>
              </div>

              {loadError && <p className="muted">{loadError}</p>}

              <div className="passage">
                {[...passage].map((ch, i) => (
                  <span key={i} className={charClass(i)}>
                    {ch}
                  </span>
                ))}
              </div>

              <textarea
                ref={inputRef}
                className="input"
                value={typed}
                onChange={handleChange}
                onPaste={(e) => e.preventDefault()}
                readOnly={status !== 'running'}
                placeholder="Start typing here..."
                spellCheck={false}
              />

              {status === 'idle' && (
                <button className="start-btn" onClick={startTest} disabled={!passage}>
                  <span>▶ Start Test</span>
                  <small>Press Enter to start</small>
                </button>
              )}

              {status === 'finished' && result && (
                <div className="result-box">
                  <p>
                    WPM: <strong>{result.wpm}</strong> | Accuracy:{' '}
                    <strong>{result.accuracy}%</strong> | Errors:{' '}
                    <strong>{result.errors}</strong> | Time:{' '}
                    <strong>{result.duration_seconds}s</strong>
                  </p>
                  <p className="muted">{saveMsg}</p>
                  <button className="start-btn" onClick={restartTest}>
                    <span>🔁 Try Again</span>
                    <small>New passage</small>
                  </button>
                </div>
              )}
            </section>

            <section className="card">
              <h3>🕘 Recent Test Results</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date &amp; Time</th>
                      <th>Duration</th>
                      <th>WPM</th>
                      <th>Accuracy</th>
                      <th>Errors</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td>{formatDate(r.created_at)}</td>
                        <td>{r.duration_seconds}s</td>
                        <td className="wpm-cell">{r.wpm}</td>
                        <td className="acc-cell">{r.accuracy}%</td>
                        <td>{r.errors}</td>
                        <td>
                          <span className={`badge ${r.category}`}>{r.category}</span>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="7" className="muted">
                          Abhi koi result nahi hai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="col">
            <section className="card">
              <h3>Select Test Duration</h3>
              <div className="chips">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={`chip ${duration === d ? 'active' : ''}`}
                    onClick={() => chooseDuration(d)}
                    disabled={status === 'running'}
                  >
                    <strong>{d}</strong>
                    Seconds
                  </button>
                ))}
              </div>

              <h3>Select Category</h3>
              <div className="chips" style={{ marginBottom: 0 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`chip ${category === c ? 'active' : ''}`}
                    onClick={() => chooseCategory(c)}
                    disabled={status === 'running'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-title-row">
                <h3>📈 Live Stats</h3>
                <button className="reset-btn" onClick={restartTest}>
                  ↻ Reset
                </button>
              </div>
              <div className="live-grid">
                <div className="live-item">
                  <strong>{liveWpm}</strong>
                  <span>WPM</span>
                </div>
                <div className="live-item">
                  <strong>{liveAccuracy}%</strong>
                  <span>Accuracy</span>
                </div>
                <div className="live-item">
                  <strong>{typed.length}</strong>
                  <span>Characters Typed</span>
                </div>
                <div className="live-item">
                  <strong>{timeLeft}s</strong>
                  <span>Time Left</span>
                </div>
              </div>
            </section>

            <section className="card">
              <h3>📊 Speed Progress (Last 7 Days)</h3>
              <SpeedChart data={progress} />
              <div className="mini-grid">
                <div className="live-item">
                  <strong>{bestThisWeek} WPM</strong>
                  <span>Best this week</span>
                </div>
                <div className="live-item">
                  <strong>{lastWpm} WPM</strong>
                  <span>Last test</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App