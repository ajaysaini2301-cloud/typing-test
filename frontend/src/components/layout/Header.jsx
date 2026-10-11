export default function Header({ title }) {
  return (
    <header className="hd-root">
      <style>{`
        .hd-root { background: #fff; padding: 14px 24px; border-bottom: 1px solid #e5e7f5; display: flex; justify-content: space-between; align-items: center; }
        .hd-title { margin: 0; font-size: 18px; color: #1e1b4b; }
        .hd-user { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #334155; }
        .hd-avatar { width: 36px; height: 36px; border-radius: 50%; background: #7c3aed; color: #fff; display: grid; place-items: center; font-weight: 700; }
      `}</style>
      <h2 className="hd-title">{title}</h2>
      <div className="hd-user">
        Hello, Learner
        <div className="hd-avatar" aria-hidden="true">L</div>
      </div>
    </header>
  )
}