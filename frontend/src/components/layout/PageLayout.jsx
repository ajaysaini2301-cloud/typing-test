import Sidebar from './Sidebar'
import Header from './Header'

export default function PageLayout({ title, children }) {
  return (
    <div className="pl-root">
      <style>{`
        .pl-root { display: flex; min-height: 100vh; }
        .pl-main { flex: 1; min-width: 0; }
      `}</style>
      <Sidebar />
      <div className="pl-main">
        <Header title={title} />
        {children}
      </div>
    </div>
  )
}