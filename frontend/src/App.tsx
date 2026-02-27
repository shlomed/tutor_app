import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuthPage } from './components/auth/AuthPage'
import { LobbyPage } from './components/lobby/LobbyPage'
import { SyllabusInputPage } from './components/syllabus/SyllabusInputPage'
import { SyllabusReviewPage } from './components/syllabus/SyllabusReviewPage'
import { SyllabusEditPage } from './components/syllabus/SyllabusEditPage'
import { LearningPage } from './components/learning/LearningPage'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/syllabus/new" element={<SyllabusInputPage />} />
          <Route path="/syllabus/review" element={<SyllabusReviewPage />} />
          <Route path="/syllabus/edit/:courseId" element={<SyllabusEditPage />} />
          <Route path="/learn/:subtopicId" element={<LearningPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
