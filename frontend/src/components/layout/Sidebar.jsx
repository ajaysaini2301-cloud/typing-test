import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../../services/api'

export const NAV_ITEMS = [
  { to: '/learning', label: 'Dashboard', icon: '🏠' },
  { to: '/learning/path', label: 'Learning Path', icon: '🗺️' },
  { to: '/learning/keyboard-basics', label: 'Keyboard Basics', icon: '⌨️' },
  { to: '/test', label: 'Typing Test', icon: '⏱️' },
  { to: '/progress', label: 'Progress', icon: '📊' },
  { to: '/achievements', label: 'Achievements', icon: '🏆' },
  { to: '/learning/review', label: 'Mistake Practice', icon: '🎯' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const [goal, setGoal] = useState(null)

  useEffect(() => {
    let alive = true
    api.getDailyGoal().then((g) => alive && setGoal(g)).catch(() => {})
    return () => { alive = false }
  }, [])

  const pct = goal ? Math.min(100, Math.round((goal.done_minutes / goal.goal_minutes) * 100)) : 0

  return (
    <aside className="sb-root">
      <style>{`
        .sb-root { width: 250px; flex-shrink: 0; background: #fff; border-right: 1px solid #e5e7f5; padding: 20px 16px; display: flex; flex-direction: column; }
        .sb-brand { font-size: 20px; font-weight: 700; color: #1e1b4b; margin-bottom: 24px; padding: 0 8px; }
        .sb-brand small { display: block; font-size: 11px; font-weight: 400; color: #64748b; }
        .sb-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; margin-bottom: 4px; color: #334155; text-decoration: none; font-size: 15px; }
        .sb-link:hover { background: #f1f3ff; }
        .sb-link.active { background: #3b6cf6; color: #fff; }
        .sb-link:focus-visible { outline: 2px solid #3b6cf6; outline-offset: 2px; }
        .sb-goal { margin-top: auto; border: 1px solid #e5e7f5; border-radius: 14px; padding: 16px; }
        .sb-goal strong { display: block; margin-bottom: 10px; color: #1e1b4b; }
        .sb-bar { height: 8px; background: #e5e7f5; border-radius: 99px; overflow: hidden; }
        .sb-bar > div { height: 100%; background: #3b82f6; }
        .sb-goal p { margin: 8px 0 0; font-size: 13px; color: #64748b; }
        @media (max-width: 800px) { .sb-root { display: none; } }
      `}</style>
      <div className="sb-brand">
        ⌨️ TypeMaster<small>Learn • Practice • Improve</small>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/learning'}
          className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
        >
          <span>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
      {goal && (
        <div className="sb-goal">
          <strong>🎯 Daily Goal: {goal.goal_minutes} minutes</strong>
          <div className="sb-bar"><div style={{ width: `${pct}%` }} /></div>
          <p>{goal.done_minutes} / {goal.goal_minutes} min</p>
        </div>
      )}
    </aside>
  )
}