import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Auth/Login'
import Registro from './pages/Auth/Registro'
import Feed from './pages/Feed/Feed'
import DetallePublicacion from './pages/Publicacion/DetallePublicacion'
import CrearPublicacion from './pages/Publicacion/CrearPublicacion'
import Ofertas from './pages/Ofertas/Ofertas'
import Perfil from './pages/Perfil/Perfil'
import Dashboard from './pages/Moderacion/Dashboard'

const RutaProtegida = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}
// Ruta para moderadores y administradores
const RutaModerador = ({ children }) => {
  const { usuario } = useAuthStore()
  if (!usuario) return <Navigate to="/login" replace />
  if (!['moderador', 'admin'].includes(usuario.rol)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<RutaProtegida><Feed /></RutaProtegida>} />
      <Route path="/publicacion/:id" element={<RutaProtegida><DetallePublicacion /></RutaProtegida>} />
      <Route path="/crear" element={<RutaProtegida><CrearPublicacion /></RutaProtegida>} />
      <Route path="/ofertas" element={<RutaProtegida><Ofertas /></RutaProtegida>} />
      <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
      <Route path="/moderacion" element={<RutaModerador><Dashboard /></RutaModerador>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}