import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../api/auth.api'
import { publicacionesAPI } from '../../api/publicaciones.api'
import { useAuthStore } from '../../store/authStore'
import { formatPrecio, tiempoAtras, inicialesNombre, CATEGORIA_ESTILOS } from '../../utils/format'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'

const ESTADO_MOD = {
  aprobada:   { bg: '#EAF3DE', color: '#3B6D11', label: 'Aprobado' },
  pendiente:  { bg: '#FAEEDA', color: '#854F0B', label: 'En revisión' },
  rechazada:  { bg: '#FCEBEB', color: '#A32D2D', label: 'Rechazado' },
  correccion: { bg: '#E6F1FB', color: '#185FA5', label: 'Corrección' },
}

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario, setAuth, logout } = useAuthStore()
  const [tab, setTab] = useState('publicaciones')
  const [perfil, setPerfil] = useState(null)
  const [misPubs, setMisPubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const ini = inicialesNombre(perfil?.nombre_completo)

  useEffect(() => {
    Promise.all([
      authAPI.perfil(),
      publicacionesAPI.misPublicaciones()
    ]).then(([p, pubs]) => {
      setPerfil(p.data.data)
      setForm(p.data.data)
      setMisPubs(pubs.data.data || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const guardarPerfil = async () => {
    setGuardando(true)
    try {
      const { data } = await authAPI.actualizarPerfil({
        nombre_completo: form.nombre_completo,
        whatsapp_numero: form.whatsapp_numero,
        whatsapp_visible: form.whatsapp_visible,
      })
      setPerfil(data.data)
      setAuth(localStorage.getItem('token'), data.data)
      setEditando(false)
      setMensaje('Perfil actualizado')
    } catch {
      setMensaje('Error actualizando perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1EFE8' }}>
      <Spinner size={40} />
    </div>
  )

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#F1EFE8', paddingBottom: 80 }}>

        {/* Header azul con info usuario */}
        <div style={{ background: '#0C447C', padding: '24px 16px 32px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>Mi perfil</h1>
              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Salir
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#185FA5', border: '3px solid #378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
                {ini}
              </div>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 18 }}>{perfil?.nombre_completo}</p>
                <p style={{ margin: '2px 0 0', color: '#85B7EB', fontSize: 13 }}>{perfil?.email}</p>
                <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                  {perfil?.rol === 'moderador' ? '🛡️ Moderador' : perfil?.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
              {[
                { label: 'Reputación', value: `⭐ ${perfil?.calificacion_promedio?.toFixed(1) || '0.0'}` },
                { label: 'Publicaciones', value: misPubs.length },
                { label: 'Rol', value: perfil?.rol },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>{value}</p>
                  <p style={{ margin: '2px 0 0', color: '#85B7EB', fontSize: 11 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '-16px auto 0', padding: '0 16px' }}>

          {mensaje && (
            <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '12px 16px', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>
              {mensaje}
            </div>
          )}

          {/* Card editar perfil */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editando ? 16 : 0 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2A' }}>Información</p>
              <button
                onClick={() => editando ? guardarPerfil() : setEditando(true)}
                style={{ background: editando ? '#185FA5' : 'none', border: editando ? 'none' : '1.5px solid #185FA5', borderRadius: 8, padding: '6px 16px', color: editando ? '#fff' : '#185FA5', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {guardando ? <Spinner size={14} color="#fff" /> : editando ? 'Guardar' : 'Editar'}
              </button>
            </div>

            {editando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888780', display: 'block', marginBottom: 4 }}>Nombre completo</label>
                  <input
                    value={form.nombre_completo || ''}
                    onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 14, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#185FA5'}
                    onBlur={e => e.target.style.borderColor = '#D3D1C7'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#888780', display: 'block', marginBottom: 4 }}>WhatsApp</label>
                  <input
                    value={form.whatsapp_numero || ''}
                    onChange={e => setForm({ ...form, whatsapp_numero: e.target.value })}
                    placeholder="3001234567"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 14, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#185FA5'}
                    onBlur={e => e.target.style.borderColor = '#D3D1C7'}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.whatsapp_visible || false}
                    onChange={e => setForm({ ...form, whatsapp_visible: e.target.checked })}
                  />
                  <span style={{ fontSize: 13, color: '#444441' }}>Mostrar WhatsApp públicamente</span>
                </label>
                <button
                  onClick={() => setEditando(false)}
                  style={{ background: 'none', border: 'none', color: '#888780', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Correo', value: perfil?.email },
                  { label: 'WhatsApp', value: perfil?.whatsapp_numero || 'No configurado' },
                  { label: 'WhatsApp visible', value: perfil?.whatsapp_visible ? 'Sí' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #F1EFE8' }}>
                    <span style={{ fontSize: 13, color: '#888780' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#2C2C2A', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs publicaciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#fff', borderRadius: 12, padding: 4, marginBottom: 12 }}>
            {['publicaciones', 'historial'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px', borderRadius: 10, border: 'none',
                  background: tab === t ? '#185FA5' : 'transparent',
                  color: tab === t ? '#fff' : '#888780',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  textTransform: 'capitalize', transition: 'all 0.15s'
                }}
              >
                {t === 'publicaciones' ? `Mis publicaciones (${misPubs.length})` : 'Historial'}
              </button>
            ))}
          </div>

          {/* Lista publicaciones */}
          {tab === 'publicaciones' && (
            misPubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888780', background: '#fff', borderRadius: 16 }}>
                <p style={{ fontSize: 36 }}>📦</p>
                <p style={{ fontWeight: 600, color: '#444441' }}>Sin publicaciones</p>
                <button
                  onClick={() => navigate('/crear')}
                  style={{ marginTop: 12, padding: '10px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                  Crear publicación
                </button>
              </div>
            ) : (
              misPubs.map(pub => {
                const estado = ESTADO_MOD[pub.estado_mod] || ESTADO_MOD.pendiente
                const cat = CATEGORIA_ESTILOS[pub.categorias?.slug]
                const img = pub.imagenes_publicacion?.[0]?.url_cloudinary
                return (
                  <div key={pub.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '0.5px solid #D3D1C7', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {img && <img src={img} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#2C2C2A', flex: 1 }}>{pub.titulo}</p>
                        <span style={{ background: estado.bg, color: estado.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          {estado.label}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#185FA5' }}>{formatPrecio(pub.precio)}</p>
                      {pub.motivo_rechazo && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '4px 8px', borderRadius: 6 }}>
                          {pub.motivo_rechazo}
                        </p>
                      )}
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888780' }}>{tiempoAtras(pub.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )
          )}

          {tab === 'historial' && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888780', background: '#fff', borderRadius: 16 }}>
              <p style={{ fontSize: 36 }}>📋</p>
              <p style={{ fontWeight: 600, color: '#444441' }}>Historial de transacciones</p>
              <p style={{ fontSize: 13 }}>Aquí aparecerán tus compras y ventas completadas</p>
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </>
  )
}