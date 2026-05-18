import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { inicialesNombre } from '../../utils/format'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuthStore()
  const ini = inicialesNombre(usuario?.nombre_completo)
  const ruta = location.pathname

  const tabs = [
    { label: 'Feed',      icon: '🏠', path: '/' },
    { label: 'Favoritos', icon: '♡',  path: '/favoritos' },
    { label: 'Publicar',  icon: '+',  path: '/crear',    especial: true },
    { label: 'Ofertas',   icon: '💬', path: '/ofertas' },
    { label: 'Perfil',    icon: ini,  path: '/perfil' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '0.5px solid #D3D1C7',
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '8px 0 14px',
      zIndex: 200, maxWidth: '100vw'
    }}>
      {tabs.map(({ label, icon, path, especial }) => {
        const activo = ruta === path
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              background: especial ? '#185FA5' : 'none',
              border: 'none',
              borderRadius: especial ? '50%' : 0,
              width: especial ? 50 : 'auto',
              height: especial ? 50 : 'auto',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              cursor: 'pointer',
              padding: especial ? 0 : '0 10px',
              color: especial ? '#fff' : activo ? '#185FA5' : '#888780',
              transform: especial ? 'translateY(-10px)' : 'none',
              boxShadow: especial ? '0 4px 16px rgba(24,95,165,0.35)' : 'none',
              fontSize: especial ? 24 : 10,
              fontWeight: 500,
              transition: 'all 0.15s'
            }}
            aria-label={label}
          >
            <span style={{ fontSize: especial ? 22 : label === 'Perfil' ? 13 : 20, lineHeight: 1,
              background: label === 'Perfil' && !especial ? (activo ? '#185FA5' : '#888780') : 'none',
              color: label === 'Perfil' ? '#fff' : 'inherit',
              borderRadius: '50%', width: label === 'Perfil' ? 28 : 'auto',
              height: label === 'Perfil' ? 28 : 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700
            }}>
              {icon}
            </span>
            {!especial && <span style={{ fontSize: 10 }}>{label}</span>}
          </button>
        )
      })}
    </nav>
  )
}