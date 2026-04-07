import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MapPage from './components/Map/MapPage.jsx'
import AdminPage from './components/Admin/AdminPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
