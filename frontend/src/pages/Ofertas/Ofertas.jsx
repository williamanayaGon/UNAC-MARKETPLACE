import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ofertasAPI } from '../../api/ofertas.api'
import { formatPrecio, tiempoAtras } from '../../utils/format'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'

const ESTADO_ESTILOS = {
  pendiente:    { bg: '#FAEEDA', color: '#854F0B', label: 'Pendiente' },
  aceptada:     { bg: '#EAF3DE', color: '#3B6D11', label: 'Aceptada' },
  rechazada:    { bg: '#FCEBEB', color: '#A32D2D', label: 'Rechazada' },
  caducada:     { bg: '#F1EFE8', color: '#5F5E5A', label: 'Caducada' },
  contraoferta: { bg: '#E6F1FB', color: '#185FA5', label: 'Contraoferta' },
}

const Badge = ({ estado }) => {
  const e = ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.pendiente
  return (
    <span style={{ background: e.bg, color: e.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
      {e.label}
    </span>
  )
}

export default function Ofertas() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('recibidas')
  const [recibidas, setRecibidas] = useState([])
  const [enviadas, setEnviadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState(null)
  const [contraofertaInput, setContraofertaInput] = useState({})
  const [mensaje, setMensaje] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const [r, e] = await Promise.all([
        ofertasAPI.recibidas(),
        ofertasAPI.enviadas()
      ])
      setRecibidas(r.data.data || [])
      setEnviadas(e.data.data || [])
    } catch {
      setRecibidas([])
      setEnviadas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const accion = async (fn, id, extra) => {
    setAccionando(id)
    setMensaje('')
    try {
      const { data } = await fn(id, extra)
      setMensaje(data.mensaje || 'Listo')
      cargar()
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'Error')
    } finally {
      setAccionando(null)
    }
  }

  const TarjetaRecibida = ({ oferta }) => {
    const cargando = accionando === oferta.id
    const pub = oferta.publicaciones
    const comprador = oferta.usuarios

    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12, border: '0.5px solid #D3D1C7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#2C2C2A' }}
               onClick={() => navigate(`/publicacion/${pub?.id}`)}
               className="cursor-pointer">
              {pub?.titulo}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888780' }}>
              Comprador: {comprador?.nombre_completo}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge estado={oferta.estado} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888780' }}>{tiempoAtras(oferta.created_at)}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>Precio original</p>
            <p style={{ margin: 0, fontSize: 14, color: '#888780', textDecoration: 'line-through' }}>
              {formatPrecio(pub?.precio)}
            </p>
          </div>
          <span style={{ color: '#D3D1C7' }}>→</span>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>Oferta</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#185FA5' }}>
              {formatPrecio(oferta.monto_ofertado)}
            </p>
          </div>
          {oferta.monto_contraoferta && (
            <>
              <span style={{ color: '#D3D1C7' }}>→</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>Tu contraoferta</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#854F0B' }}>
                  {formatPrecio(oferta.monto_contraoferta)}
                </p>
              </div>
            </>
          )}
        </div>

        {oferta.estado === 'pendiente' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => accion(ofertasAPI.aceptar, oferta.id)}
                disabled={cargando}
                style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#EAF3DE', color: '#3B6D11', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {cargando ? <Spinner size={14} color="#3B6D11" /> : '✓ Aceptar'}
              </button>
              <button
                onClick={() => setContraofertaInput(p => ({ ...p, [oferta.id]: p[oferta.id] ? null : '' }))}
                disabled={cargando}
                style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#E6F1FB', color: '#185FA5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Contraoferta
              </button>
              <button
                onClick={() => accion(ofertasAPI.rechazar, oferta.id)}
                disabled={cargando}
                style={{ padding: '10px', borderRadius: 10, border: 'none', background: '#FCEBEB', color: '#A32D2D', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                ✕ Rechazar
              </button>
            </div>

            {contraofertaInput[oferta.id] !== undefined && contraofertaInput[oferta.id] !== null && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="Tu precio"
                  value={contraofertaInput[oferta.id]}
                  onChange={e => setContraofertaInput(p => ({ ...p, [oferta.id]: e.target.value }))}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 14, outline: 'none' }}
                />
                <button
                  onClick={() => accion(ofertasAPI.contraoferta, oferta.id, contraofertaInput[oferta.id])}
                  disabled={cargando}
                  style={{ padding: '10px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                  Enviar
                </button>
              </div>
            )}
          </>
        )}

        {oferta.estado === 'aceptada' && (
          <div style={{ background: '#EAF3DE', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3B6D11' }}>
            ✅ Oferta aceptada — coordina la entrega por WhatsApp con el comprador
          </div>
        )}
      </div>
    )
  }

  const TarjetaEnviada = ({ oferta }) => {
    const pub = oferta.publicaciones
    const img = pub?.imagenes_publicacion?.[0]?.url_cloudinary

    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12, border: '0.5px solid #D3D1C7' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {img && <img src={img} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#2C2C2A', flex: 1 }}>{pub?.titulo}</p>
              <Badge estado={oferta.estado} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>Tu oferta</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#185FA5' }}>{formatPrecio(oferta.monto_ofertado)}</p>
              </div>
              {oferta.monto_contraoferta && (
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#888780' }}>Contraoferta</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#854F0B' }}>{formatPrecio(oferta.monto_contraoferta)}</p>
                </div>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888780' }}>{tiempoAtras(oferta.created_at)}</p>
          </div>
        </div>

        {oferta.estado === 'contraoferta' && (
          <div style={{ marginTop: 12, background: '#E6F1FB', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#185FA5' }}>
            El vendedor hizo una contraoferta de <strong>{formatPrecio(oferta.monto_contraoferta)}</strong>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#F1EFE8', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ background: '#0C447C', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 12px', color: '#fff', fontSize: 20, fontWeight: 700 }}>Mis ofertas</h1>

            {/* Info correo */}
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#B5D4F4' }}>
              ℹ️ Las alertas llegan a tu correo — entra aquí para responder
            </div>

            {/* Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 4 }}>
              {['recibidas', 'enviadas'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px', borderRadius: 8, border: 'none',
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? '#185FA5' : '#fff',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.15s', textTransform: 'capitalize'
                  }}
                >
                  {t === 'recibidas' ? `Recibidas (${recibidas.length})` : `Enviadas (${enviadas.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
          {mensaje && (
            <div style={{ background: '#EAF3DE', color: '#3B6D11', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
              {mensaje}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spinner size={36} />
            </div>
          ) : tab === 'recibidas' ? (
            recibidas.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888780' }}>
                  <p style={{ fontSize: 40 }}>📭</p>
                  <p style={{ fontWeight: 600, color: '#444441' }}>Sin ofertas recibidas</p>
                  <p style={{ fontSize: 13 }}>Cuando alguien haga una oferta en tus publicaciones aparecerá aquí</p>
                </div>
              : recibidas.map(o => <TarjetaRecibida key={o.id} oferta={o} />)
          ) : (
            enviadas.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888780' }}>
                  <p style={{ fontSize: 40 }}>📤</p>
                  <p style={{ fontWeight: 600, color: '#444441' }}>Sin ofertas enviadas</p>
                  <p style={{ fontSize: 13 }}>Explora el feed y haz ofertas en publicaciones que te interesen</p>
                </div>
              : enviadas.map(o => <TarjetaEnviada key={o.id} oferta={o} />)
          )}
        </div>
      </div>
      <Navbar />
    </>
  )
}