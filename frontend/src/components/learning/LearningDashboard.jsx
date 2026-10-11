import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL;', 'ZXCVBNM,.']

const TAG = {
  'Typing Test': 'ld-tag-purple',
  'Word Practice': 'ld-tag-green',
  'Character Practice': 'ld-tag-teal',
  'Sentence Practice': 'ld-tag-orange',
  'Paragraph Practice': 'ld-tag-orange',
}

function fmtTime(sec) {
  return sec < 60 ? `${sec} sec` : `${Math.round(sec / 60)} min`
}

function fmtDate(iso) {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const now = new Date()
  const yest = new Date(now.getTime() - 86400000)
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`
  if (d.toDateString() === yest.toDateString()) return `Yesterday, ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`
}

function Delta({ value, suffix }) {
  if (value === null || value === undefined) return null
  const up = value >= 0
  return (
    <span className={`ld-delta ${up ? 'up' : 'down'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}{suffix}
    </span>
  )
}

function PerfChart({ data }) {
  if (data.length === 0) {
    return <p className="ld-muted">Pichle 7 din mein koi practice nahi hui.</p>
  }
  const W = 460, H = 190, P = 30
  const x = (i) => (data.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (data.length - 1))
  const y = (v) => H - P - (Math.min(v, 100) / 100) * (H - 2 * P)
  const line = (key) => data.map((d, i) => `${x(i)},${y(d[key])}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="WPM and accuracy, last 7 days">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#eef0f8" />
          <text x={4} y={y(v) + 4} className="ld-axis">{v}</text>
        </g>
      ))}
      {data.length > 1 && (
        <>
          <polyline points={line('accuracy')} fill="none" stroke="#a855f7" strokeWidth="2.5" />
          <polyline points={line('wpm')} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        </>
      )}
      {data.map((d, i) => (
        <g key={d.day}>
          <circle cx={x(i)} cy={y(d.wpm)} r="4" fill="#3b82f6" />
          <circle cx={x(i)} cy={y(d.accuracy)} r="4" fill="#a855f7" />
          <text x={x(i)} y={H - 8} textAnchor="middle" className="ld-axis">{d.day.slice(5)}</text>
        </g>
      ))}
    </svg>
  )
}

export default function LearningDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api.getLearningDashboard()
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const s = data?.stats
  const cur = data?.current_stage
  const next = data?.next_lesson
  const ctaTo = next ? `/learning/practice/${next.id}` : '/test'
  const ctaText = next ? 'Continue Learning' : 'Take a Typing Test'
  const val = (v, suffix = '') => (loading ? '…' : v === null || v === undefined ? '—' : `${v}${suffix}`)

  return (
    <div className="ld-root">
      <style>{`
        .ld-root { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; padding: 20px 24px; }
        .ld-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .ld-card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(79,70,229,0.06); }
        .ld-card h3 { margin: 0 0 14px; font-size: 17px; }
        .ld-card-head { display: flex; justify-content: space-between; align-items: baseline; }
        .ld-muted { color: #64748b; font-size: 13px; margin: 0; }
        .ld-error { background: #fee2e2; color: #b91c1c; padding: 12px 16px; border-radius: 12px; grid-column: 1 / -1; }
        .ld-hero { position: relative; overflow: hidden; background: linear-gradient(120deg, #1e1b6b, #3b4cd6 65%, #6d4be8); color: #fff; border-radius: 16px; padding: 28px; display: flex; justify-content: space-between; gap: 20px; min-height: 230px; }
        .ld-hero h1 { margin: 6px 0 10px; font-size: 32px; line-height: 1.2; }
        .ld-hero p { margin: 0 0 18px; max-width: 360px; opacity: 0.9; }
        .ld-cta { display: inline-flex; gap: 10px; align-items: center; background: #fff; color: #1e1b4b; padding: 12px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; }
        .ld-cta:focus-visible, .ld-link:focus-visible, .ld-arrow:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 2px; }
        .ld-kbwrap { align-self: center; position: relative; }
        .ld-bubble { background: #86efac; color: #14532d; padding: 8px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 10px; display: inline-block; }
        .ld-kb { background: rgba(255,255,255,0.12); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .ld-kb-row { display: flex; gap: 6px; justify-content: center; }
        .ld-k { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.18); color: #e0e7ff; display: grid; place-items: center; font-size: 12px; font-weight: 600; }
        .ld-k.blue { background: #3b82f6; color: #fff; }
        .ld-k.purple { background: #a855f7; color: #fff; }
        .ld-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .ld-stat { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(79,70,229,0.06); }
        .ld-stat.fire { background: #fff7ed; }
        .ld-stat > span { font-size: 14px; color: #334155; }
        .ld-stat-row { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 2px; }
        .ld-stat strong { font-size: 30px; }
        .ld-stat small { color: #94a3b8; font-size: 12px; }
        .ld-delta { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 8px; }
        .ld-delta.up { background: #dcfce7; color: #15803d; }
        .ld-delta.down { background: #fee2e2; color: #b91c1c; }
        .ld-stages { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .ld-stage { border: 1px solid #e5e7f5; border-radius: 12px; padding: 14px; background: #f8f9ff; font-size: 13px; position: relative; }
        .ld-stage.available { border-color: #93c5fd; background: #fff; }
        .ld-stage.locked { opacity: 0.75; }
        .ld-stage b { display: block; margin: 4px 0 10px; font-size: 14px; color: #1e1b4b; }
        .ld-bar { height: 8px; background: #e5e7f5; border-radius: 99px; overflow: hidden; margin: 8px 0 6px; }
        .ld-bar > div { height: 100%; background: #3b82f6; }
        .ld-arrow { position: absolute; right: 12px; bottom: 12px; width: 32px; height: 32px; border-radius: 50%; background: #3b6cf6; color: #fff; display: grid; place-items: center; text-decoration: none; }
        .ld-link { color: #3b6cf6; font-weight: 600; text-decoration: none; font-size: 13px; }
        .ld-table-wrap { overflow-x: auto; }
        .ld-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .ld-table th { background: #f1f3ff; color: #475569; text-align: left; padding: 10px; }
        .ld-table td { padding: 11px 10px; border-bottom: 1px solid #eef0f8; }
        .ld-acc { color: #16a34a; font-weight: 700; }
        .ld-tag { padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
        .ld-tag-purple { background: #ede9fe; color: #6d28d9; }
        .ld-tag-green { background: #dcfce7; color: #15803d; }
        .ld-tag-teal { background: #ccfbf1; color: #0f766e; }
        .ld-tag-orange { background: #ffedd5; color: #c2410c; }
        .ld-prog { display: flex; gap: 16px; align-items: center; }
        .ld-ring { width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
        .ld-ring > div { width: 70px; height: 70px; border-radius: 50%; background: #fff; display: grid; place-items: center; font-size: 20px; font-weight: 700; }
        .ld-btn-soft { display: flex; justify-content: space-between; margin-top: 16px; background: #eaf0ff; color: #3b6cf6; padding: 12px 14px; border-radius: 10px; text-decoration: none; font-weight: 600; }
        .ld-act { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eef0f8; font-size: 14px; }
        .ld-act:last-child { border-bottom: 0; }
        .ld-axis { font-size: 11px; fill: #94a3b8; }
        .ld-legend { display: flex; gap: 16px; font-size: 12px; color: #475569; margin-bottom: 6px; }
        @media (max-width: 1100px) { .ld-root { grid-template-columns: 1fr; } .ld-kbwrap { display: none; } }
        @media (max-width: 800px) { .ld-stats, .ld-stages { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {error && <div className="ld-error" role="alert">{error}</div>}

      <div className="ld-col">
        <section className="ld-hero">
          <div>
            <small>Welcome Back!</small>
            <h1>Continue Your<br />Typing Journey</h1>
            <p>Practice daily, improve your skills, and become a faster and more accurate typer.</p>
            <Link to={ctaTo} className="ld-cta">▶ {ctaText} →</Link>
          </div>
          <div className="ld-kbwrap" aria-hidden="true">
            {s && s.streak_days > 0 && <div className="ld-bubble">📈 Good progress! Keep it up!</div>}
            <div className="ld-kb">
              {KB_ROWS.map((row) => (
                <div className="ld-kb-row" key={row}>
                  {[...row].map((ch) => (
                    <div
                      key={ch}
                      className={`ld-k ${'ASDF'.includes(ch) ? 'blue' : 'JKL;'.includes(ch) ? 'purple' : ''}`}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ld-stats">
          <div className="ld-stat">
            <span>⚡ Current WPM</span>
            <div className="ld-stat-row">
              <strong>{val(s?.current_wpm)}</strong>
              <Delta value={s?.wpm_change_pct} suffix="%" />
            </div>
            <small>{s?.wpm_change_pct != null ? 'vs last week' : 'latest session'}</small>
          </div>
          <div className="ld-stat">
            <span>🎯 Best WPM</span>
            <div className="ld-stat-row"><strong>{val(s?.best_wpm)}</strong></div>
            <small>personal best</small>
          </div>
          <div className="ld-stat">
            <span>📊 Accuracy</span>
            <div className="ld-stat-row">
              <strong>{val(s?.accuracy, '%')}</strong>
              <Delta value={s?.accuracy_delta} suffix="%" />
            </div>
            <small>last session</small>
          </div>
          <div className="ld-stat fire">
            <span>🔥 Practice Streak</span>
            <div className="ld-stat-row"><strong>{val(s?.streak_days, ' days')}</strong></div>
            <small>{s && s.streak_days > 0 ? 'Keep it going!' : 'Aaj practice karke streak shuru karo'}</small>
          </div>
        </div>

        <section className="ld-card">
          <div className="ld-card-head">
            <h3>Your Learning Stages</h3>
            <Link to="/learning/path" className="ld-link">View All →</Link>
          </div>
          <div className="ld-stages">
            {(data?.stages || []).map((st) => (
              <div key={st.stage_number} className={`ld-stage ${st.status}`}>
                {st.icon} Stage {st.stage_number}
                <b>{st.title}</b>
                {st.status === 'locked' ? (
                  <span className="ld-muted">🔒 Locked</span>
                ) : (
                  <span className="ld-muted">{st.percent}% complete</span>
                )}
                <div className="ld-bar"><div style={{ width: `${st.percent}%` }} /></div>
                <span className="ld-muted">{st.completed_lessons} / {st.total_lessons} lessons</span>
                {st.status !== 'locked' && (
                  <Link
                    className="ld-arrow"
                    to={st.stage_number === 4 ? '/test' : '/learning/path'}
                    aria-label={`Open stage ${st.stage_number}`}
                  >→</Link>
                )}
              </div>
            ))}
            {loading && <p className="ld-muted">Loading…</p>}
          </div>
        </section>

        <section className="ld-card">
          <div className="ld-card-head">
            <h3>Recent Practice Results</h3>
            <Link to="/test" className="ld-link">View All →</Link>
          </div>
          <div className="ld-table-wrap">
            <table className="ld-table">
              <thead><tr><th>Date</th><th>Type</th><th>Accuracy</th><th>WPM</th><th>Time</th></tr></thead>
              <tbody>
                {(data?.recent || []).map((r, i) => (
                  <tr key={i}>
                    <td>{fmtDate(r.created_at)}</td>
                    <td><span className={`ld-tag ${TAG[r.activity_type] || ''}`}>{r.activity_type}</span></td>
                    <td className="ld-acc">{r.accuracy}%</td>
                    <td>{r.wpm}</td>
                    <td>{fmtTime(r.duration_seconds)}</td>
                  </tr>
                ))}
                {!loading && data && data.recent.length === 0 && (
                  <tr><td colSpan="5" className="ld-muted">Abhi koi practice nahi hui.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="ld-col">
        <section className="ld-card">
          <div className="ld-card-head">
            <h3>Current Progress</h3>
            {cur && <span className="ld-muted">Stage {cur.stage_number} of {data.stages.length}</span>}
          </div>
          {cur ? (
            <>
              <div className="ld-prog">
                <div className="ld-ring" style={{ background: `conic-gradient(#22c55e ${cur.percent}%, #e5e7f5 0)` }}>
                  <div>{cur.percent}%</div>
                </div>
                <div>
                  <b>{cur.title}</b>
                  <p className="ld-muted">{cur.completed_lessons} of {cur.total_lessons} lessons completed</p>
                </div>
              </div>
              <Link to="/learning/path" className="ld-btn-soft"><span>🗺️ View Learning Path</span><span>→</span></Link>
            </>
          ) : (
            <p className="ld-muted">{loading ? 'Loading…' : 'Lessons abhi load nahi hue. seed_lessons.py chalaya?'}</p>
          )}
        </section>

        <section className="ld-card">
          <h3>📅 Today&apos;s Activity</h3>
          {data && data.today.length === 0 && <p className="ld-muted">Aaj abhi koi practice nahi hui.</p>}
          {(data?.today || []).map((r, i) => (
            <div key={i} className="ld-act">
              <span>
                <b>{r.activity_type}</b><br />
                <small className="ld-muted">{fmtTime(r.duration_seconds)} • {r.accuracy}% accuracy</small>
              </span>
              <span aria-label="completed">✅</span>
            </div>
          ))}
        </section>

        <section className="ld-card">
          <h3>📊 Performance Chart</h3>
          <div className="ld-legend"><span>🔵 WPM</span><span>🟣 Accuracy (%)</span></div>
          <PerfChart data={data?.chart || []} />
          <p className="ld-muted">Last 7 days (daily average)</p>
        </section>
      </div>
    </div>
  )
}