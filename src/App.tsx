import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './components/LoginPage'
import { FilmsListPage } from './components/FilmsListPage'
import { FilmDetailPage } from './components/FilmDetailPage'
import { FestivalsListPage } from './components/FestivalsListPage'
import { FestivalDetailPage } from './components/FestivalDetailPage'
import { ItinerariesListPage } from './components/ItinerariesListPage'
import { PersonsListPage } from './components/PersonsListPage'
import { PersonDetailPage } from './components/PersonDetailPage'

function DashboardHome() {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Welcome to Austrian Films</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick a section on the left: Films, Festivals or Itineraries.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardHome />} />
        <Route path="/films" element={<FilmsListPage />} />
        <Route path="/films/:id" element={<FilmDetailPage />} />
        <Route path="/festivals" element={<FestivalsListPage />} />
        <Route path="/festivals/:id" element={<FestivalDetailPage />} />
        <Route path="/itineraries" element={<ItinerariesListPage />} />
        <Route path="/persons" element={<PersonsListPage />} />
        <Route path="/persons/:id" element={<PersonDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
