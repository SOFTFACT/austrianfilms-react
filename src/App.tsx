import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './components/LoginPage'
import { FilmsListPage } from './components/FilmsListPage'
import { FilmDetailPage } from './components/FilmDetailPage'
import { FestivalsListPage } from './components/FestivalsListPage'
import { FestivalDetailPage } from './components/FestivalDetailPage'
import { ItinerariesListPage } from './components/ItinerariesListPage'
import { PartiesListPage } from './components/PartiesListPage'
import { PartyDetailPage } from './components/PartyDetailPage'

/** Party.id IS the old personen_id, so an old person link lands on the same row. */
function PartyRedirect() {
  const { id } = useParams()
  return <Navigate to={`/contacts/${id}`} replace />
}

function DashboardHome() {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Welcome to Austrian Films</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a section on the left: Films, Festivals, Itineraries, Contacts.
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
        <Route path="/contacts" element={<PartiesListPage />} />
        <Route path="/contacts/:id" element={<PartyDetailPage />} />
        {/* the persons screen read the frozen legacy table; its links keep working */}
        <Route path="/persons" element={<Navigate to="/contacts" replace />} />
        <Route path="/persons/:id" element={<PartyRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
