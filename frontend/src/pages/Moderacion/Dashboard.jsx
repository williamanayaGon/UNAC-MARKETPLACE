import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrecio, tiempoAtras } from '../../utils/format'
import Spinner from '../../components/ui/Spinner'
import client from '../../api/client'

export default function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('cola')
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [cola, setCola] = useState([])
  const [reportes, setReportes] = useState([])
  const [politicas, setPoliticas] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState(null)
  const [motivoExtra, setMotivoExtra] = useState({})
  const [mensaje, setMensaje] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const [c, r, p, s] = await Promise.all([
        client.get('/moderacion/cola'),
        client.get('/moderacion/reportes'),
        client.get('/moderacion/politicas'),
        client.get('/moderacion/stats'),
      ])
      setCola(c.data.data || [])
      setReportes(r.data.data || [])
      setPoliticas(p.data.data || [])
      setStats(s.data.data)
    } catch {
      setCola([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const accion = async (url, datos = {}) => {
    setAccionando(url)
    setMensaje('')
    try {
      const { data } = await client.put(url, datos)
      setMensaje(data.mensaje || 'Acción realizada')
      cargar()
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'Error')
    } finally {
      setAccionando(null)
    }
  }

  const cargando = (url) => accionando === url

  const tabs = [
    { key: 'cola', label: 'Cola de revisión', badge: stats?.pendientes },
    { key: 'reportes', label: 'Reportes', badge: stats?.reportes_pendientes },
    { key: 'politicas', label: 'Políticas', badge: null },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F1EFE8', display: 'flex', position: 'relative' }}>

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, display: 'none' }}
          className="overlay-mobile"
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .overlay-mobile { display: block !important; }
          .sidebar-mod { position: fixed !important; z-index: 100; height: 100vh; }
        }
      `}</style>

      {/* Sidebar */}
      <div
        className="sidebar-mod"
        style={{
          width: sidebarAbierto ? 220 : 0,
          minWidth: sidebarAbierto ? 220 : 0,
          background: '#0C447C',
          minHeight: '100vh',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ width: 220, padding: '20px 0' }}>
          {/* Logo */}
          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: '#185FA5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>U</span>
              </div>
              <div>
                <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>UNAC MKT</p>
                <p style={{ margin: 0, color: '#85B7EB', fontSize: 10, whiteSpace: 'nowrap' }}>Moderación</p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <p style={{ margin: '0 0 6px', padding: '0 16px', fontSize: 10, fontWeight: 700, color: '#378ADD', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Revisión</p>
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                width: '100%', padding: '11px 16px', border: 'none', textAlign: 'left',
                background: tab === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: tab === key ? '#fff' : '#85B7EB',
                fontSize: 13, fontWeight: tab === key ? 600 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', whiteSpace: 'nowrap',
                borderLeft: tab === key ? '3px solid #378ADD' : '3px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {label}
              {badge > 0 && (
                <span style={{ background: '#E24B4A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, flexShrink: 0 }}>
                  {badge}
                </span>
              )}
            </button>
          ))}

          {/* Volver */}
          <div style={{ padding: '24px 16px 0' }}>
            <button
              onClick={() => navigate('/')}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#85B7EB', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ← Volver al feed
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ background: '#0C447C', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}>
              {sidebarAbierto ? '✕' : '☰'}
            </span>
          </button>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 700 }}>
            {tabs.find(t => t.key === tab)?.label}
          </h1>
          {stats && (
            <span style={{ marginLeft: 'auto', background: '#E24B4A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {stats.pendientes} pendientes
            </span>
          )}
        </div>

        <div style={{ padding: '20px', flex: 1 }}>

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Pendientes', value: stats.pendientes, bg: '#FAEEDA', color: '#854F0B' },
                { label: 'Aprobadas hoy', value: stats.aprobadas_hoy, bg: '#EAF3DE', color: '#3B6D11' },
                { label: 'Rechazadas hoy', value: stats.rechazadas_hoy, bg: '#FCEBEB', color: '#A32D2D' },
                { label: 'Reportes', value: stats.reportes_pendientes, bg: '#E6F1FB', color: '#185FA5' },
              ].map(({ label, value, bg, color }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{value}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color, opacity: 0.8 }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {mensaje && (
            <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
              ✅ {mensaje}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Spinner size={40} />
            </div>
          ) : (
            <>
              {/* COLA */}
              {tab === 'cola' && (
                cola.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16 }}>
                    <p style={{ fontSize: 48 }}>✅</p>
                    <p style={{ fontWeight: 600, color: '#444441', fontSize: 18 }}>Cola vacía</p>
                    <p style={{ fontSize: 14, color: '#888780' }}>No hay publicaciones pendientes</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cola.map(pub => (
                      <div key={pub.id} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '0.5px solid #D3D1C7' }}>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                          {pub.imagenes_publicacion?.[0] && (
                            <img src={pub.imagenes_publicacion[0].url_cloudinary} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2C2C2A' }}>{pub.titulo}</h3>
                              <span style={{ background: '#FAEEDA', color: '#854F0B', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Pendiente</span>
                            </div>
                            <p style={{ margin: '4px 0', fontSize: 12, color: '#888780' }}>
                              {pub.usuarios?.nombre_completo} • {tiempoAtras(pub.created_at)}
                            </p>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#185FA5' }}>{formatPrecio(pub.precio)}</p>
                          </div>
                        </div>

                        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#444441', lineHeight: 1.6 }}>{pub.descripcion}</p>

                        {pub.imagenes_publicacion?.length > 1 && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            {pub.imagenes_publicacion.slice(1).map((img, i) => (
                              <img key={i} src={img.url_cloudinary} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                            ))}
                          </div>
                        )}

                        {pub.usuarios?.whatsapp_numero && (
                          <a
                            href={`https://wa.me/57${pub.usuarios.whatsapp_numero.replace(/\D/g, '')}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF3DE', color: '#3B6D11', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}
                          >
                            📱 Contactar: {pub.usuarios.whatsapp_numero}
                          </a>
                        )}

                        <div style={{ marginBottom: 12 }}>
                          <select
                            value={motivoExtra[pub.id]?.politica || ''}
                            onChange={e => setMotivoExtra(p => ({ ...p, [pub.id]: { ...p[pub.id], politica: e.target.value } }))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 14, outline: 'none', background: '#fff', marginBottom: 8 }}
                          >
                            <option value="">Seleccionar política de rechazo</option>
                            {politicas.map(p => (
                              <option key={p.id} value={p.id}>{p.titulo}</option>
                            ))}
                          </select>
                          <textarea
                            placeholder="Comentario adicional (opcional)"
                            value={motivoExtra[pub.id]?.comentario || ''}
                            onChange={e => setMotivoExtra(p => ({ ...p, [pub.id]: { ...p[pub.id], comentario: e.target.value } }))}
                            rows={2}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => accion(`/moderacion/${pub.id}/aprobar`)}
                            disabled={!!accionando}
                            style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#EAF3DE', color: '#3B6D11', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            {cargando(`/moderacion/${pub.id}/aprobar`) ? <Spinner size={14} color="#3B6D11" /> : '✓ Aprobar'}
                          </button>
                          <button
                            onClick={() => accion(`/moderacion/${pub.id}/correccion`, { motivo_rechazo: motivoExtra[pub.id]?.comentario || 'Por favor corrige tu publicación' })}
                            disabled={!!accionando}
                            style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#E6F1FB', color: '#185FA5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                          >
                            Corrección
                          </button>
                          <button
                            onClick={() => {
                              if (!motivoExtra[pub.id]?.politica) { setMensaje('Selecciona una política de rechazo'); return }
                              accion(`/moderacion/${pub.id}/rechazar`, {
                                politica_rechazo_id: Number(motivoExtra[pub.id].politica),
                                motivo_rechazo: motivoExtra[pub.id]?.comentario
                              })
                            }}
                            disabled={!!accionando}
                            style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#FCEBEB', color: '#A32D2D', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* REPORTES */}
              {tab === 'reportes' && (
                reportes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16 }}>
                    <p style={{ fontSize: 48 }}>🎉</p>
                    <p style={{ fontWeight: 600, color: '#444441', fontSize: 18 }}>Sin reportes pendientes</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {reportes.map(rep => (
                      <div key={rep.id} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '0.5px solid #D3D1C7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2C2C2A' }}>{rep.publicaciones?.titulo}</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888780' }}>
                              Por: {rep.usuarios?.nombre_completo} • {tiempoAtras(rep.created_at)}
                            </p>
                          </div>
                          <span style={{ background: '#FCEBEB', color: '#A32D2D', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Sin revisar</span>
                        </div>

                        <div style={{ background: '#F1EFE8', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                          <p style={{ margin: 0, fontSize: 13, color: '#444441' }}><strong>Motivo:</strong> {rep.motivo}</p>
                        </div>

                        {rep.publicaciones?.imagenes_publicacion?.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            {rep.publicaciones.imagenes_publicacion.map((img, i) => (
                              <img key={i} src={img.url_cloudinary} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                            ))}
                          </div>
                        )}

                        {rep.publicaciones?.usuarios?.whatsapp_numero && (
                          <a
                            href={`https://wa.me/57${rep.publicaciones.usuarios.whatsapp_numero.replace(/\D/g, '')}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF3DE', color: '#3B6D11', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}
                          >
                            📱 Contactar vendedor
                          </a>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => accion(`/moderacion/reportes/${rep.id}/resolver`, { accion: 'suspender_publicacion' })} disabled={!!accionando}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#FCEBEB', color: '#A32D2D', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            Suspender
                          </button>
                          <button onClick={() => accion(`/moderacion/reportes/${rep.id}/resolver`, { accion: 'advertir_usuario' })} disabled={!!accionando}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#FAEEDA', color: '#854F0B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            Advertir
                          </button>
                          <button onClick={() => accion(`/moderacion/reportes/${rep.id}/resolver`, { accion: 'desestimar' })} disabled={!!accionando}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#F1EFE8', color: '#5F5E5A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            Desestimar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* POLÍTICAS */}
              {tab === 'politicas' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px' }}>
                  <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#2C2C2A' }}>Políticas de moderación</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {politicas.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F1EFE8', borderRadius: 12 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#2C2C2A' }}>{p.titulo}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888780' }}>{p.descripcion}</p>
                        </div>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.activa ? '#639922' : '#E24B4A', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}