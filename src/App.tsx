import { Routes, Route, Navigate } from 'react-router-dom'
import CalendarTodo from './pages/CalendarTodo'
import Signup from './pages/Signup'
import Portfolio from './pages/Portfolio'
import MovieHome from './pages/movie/MovieHome'
import MovieDetail from './pages/movie/MovieDetail'
import TvDetail from './pages/movie/TvDetail'
import Person from './pages/movie/Person'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CalendarTodo />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<Portfolio />} />
      <Route path="/movie" element={<MovieHome />} />
      <Route path="/movie/:id" element={<MovieDetail />} />
      <Route path="/tv/:id" element={<TvDetail />} />
      <Route path="/person/:id" element={<Person />} />
      {/* 기존 .html 경로 하위호환 */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/about.html" element={<Navigate to="/about" replace />} />
      <Route path="/movie.html" element={<Navigate to="/movie" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
