import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from './components/layout/PageLayout'
import TimedTypingTest from './components/test/TimedTypingTest'
import LearningDashboard from './components/learning/LearningDashboard'
import TypingPractice from './components/learning/TypingPractice'

function ComingSoon({ title }) {
  return (
    <PageLayout title={title}>
      <p style={{ padding: 24, color: '#64748b' }}>
        Ye page abhi bana nahi hai. Agle milestones mein banega.
      </p>
    </PageLayout>
  )
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
      <Routes>
        <Route path="/" element={<Navigate to="/test" replace />} />
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
        {PLACEHOLDERS.map(([path, title]) => (
          <Route key={path} path={path} element={<ComingSoon title={title} />} />
        ))}
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Routes>
    </BrowserRouter>
  )
}