import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import PageLayout from './components/layout/PageLayout'
import TimedTypingTest from './components/test/TimedTypingTest'
import LearningDashboard from './components/learning/LearningDashboard'
import TypingPractice from './components/learning/TypingPractice'

import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

function ComingSoon({ title }) {
  return (
    <PageLayout title={title}>
      <p style={{ padding: 24, color: '#64748b' }}>
        Ye page abhi bana nahi hai. Agle milestones mein banega.
      </p>
    </PageLayout>
  )
}

function ProtectedRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p style={{ padding: 24 }}>Checking authentication...</p>

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

const PLACEHOLDERS = [
  ['/learning/practice/:lessonId', 'Lesson Practice'],
  ['/learning/path', 'Learning Path'],
  ['/learning/keyboard-basics', 'Keyboard Basics'],
  ['/learning/review', 'Mistake Practice'],
  ['/progress', 'Progress'],
  ['/achievements', 'Achievements'],
  ['/settings', 'Settings'],
]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Navigate to="/learning" replace />} />

            <Route
              path="/learning"
              element={
                <PageLayout title="Dashboard">
                  <LearningDashboard />
                </PageLayout>
              }
            />

            <Route
              path="/learning/practice/:lessonId"
              element={
                <PageLayout title="Lesson Practice">
                  <TypingPractice />
                </PageLayout>
              }
            />

            <Route
              path="/test"
              element={
                <PageLayout title="Timed Typing Test">
                  <TimedTypingTest />
                </PageLayout>
              }
            />

            {PLACEHOLDERS
              .filter(([path]) => path !== '/learning/practice/:lessonId')
              .map(([path, title]) => (
                <Route
                  key={path}
                  path={path}
                  element={<ComingSoon title={title} />}
                />
              ))}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}