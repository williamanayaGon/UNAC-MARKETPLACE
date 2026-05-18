import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/ui/Spinner'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setErrorMsg('')
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.data.token, data.data.usuario)
      navigate('/')
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F1EFE8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 32px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(24,95,165,0.10)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: '#0C447C',
            borderRadius: 16, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>U</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#2C2C2A' }}>UNAC Marketplace</h1>
          <p style={{ margin: '4px 0 0', color: '#888780', fontSize: 14 }}>Inicia sesión en tu cuenta</p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px',
            borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#185FA5'}
              onBlur={e => e.target.style.borderColor = '#D3D1C7'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#185FA5'}
              onBlur={e => e.target.style.borderColor = '#D3D1C7'}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: cargando ? '#B5D4F4' : '#185FA5',
              color: '#fff', border: 'none', fontSize: 16,
              fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s'
            }}
          >
            {cargando ? <Spinner size={20} color="#fff" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888780' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}