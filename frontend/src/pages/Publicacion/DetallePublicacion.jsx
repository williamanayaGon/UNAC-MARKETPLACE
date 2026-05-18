import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { publicacionesAPI } from '../../api/publicaciones.api'
import { ofertasAPI } from '../../api/ofertas.api'
import { useAuthStore } from '../../store/authStore'
import { formatPrecio, tiempoAtras, CATEGORIA_ESTILOS, inicialesNombre } from '../../utils/format'
import BotonWhatsapp from '../../components/ui/BotonWhatsapp'
import Spinner from '../../components/ui/Spinner'

export default function DetallePublicacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [pub, setPub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgActiva, setImgActiva] = useState(0)
  const [mostrarOferta, setMostrarOferta] = useState(false)
  const [montoOferta, setMontoOferta] = useState('')
  const [enviandoOferta, setEnviandoOferta] = useState(false)
  const [mensajeOferta, setMensajeOferta] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    publicacionesAPI.obtener(id)
      .then(({ data }) => setPub(data.data))
      .catch(() => setErrorMsg('Publicación no encontrada'))
      .finally(() => setLoading(false))
  }, [id])

  const enviarOferta = async () => {
    if (!montoOferta || Number(montoOferta) <= 0) return
    setEnviandoOferta(true)
    try {
      await ofertasAPI.enviar({
        publicacion_id: id,
        monto_ofertado: Number(montoOferta)
      })
      setMensajeOferta('¡Oferta enviada! El vendedor tiene 48h para responder.')
      setMostrarOferta(false)
      setMontoOferta('')
    } catch (err) {
      setMensajeOferta(err.response?.data?.mensaje || 'Error enviando oferta')
    } finally {
      setEnviandoOferta(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1EFE8' }}>
      <Spinner size={40} />
    </div>
  )

  if (errorMsg || !pub) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F1EFE8', gap: 16 }}>
      <p style={{ fontSize: 40 }}>😕</p>
      <p style={{ color: '#444441', fontWeight: 600 }}>{errorMsg || 'No encontrada'}</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
        Volver al feed
      </button>
    </div>
  )

  const cat = CATEGORIA_ESTILOS[pub.categorias?.slug] || CATEGORIA_ESTILOS.objetos
  const imagenes = pub.imagenes_publicacion || []
  const ini = inicialesNombre(pub.usuarios?.nombre_completo)
  const esDueno = usuario?.id === pub.usuario_id

  return (
    <div style={{ minHeight: '100vh', background: '#F1EFE8', paddingBottom: 100 }}>

      {/* Imagen principal */}
      <div style={{ position: 'relative', background: '#2C2C2A' }}>
        {imagenes.length > 0
          ? <img src={imagenes[imgActiva]?.url_cloudinary} alt={pub.titulo}
              style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📷</div>
        }

        {/* Botones nav */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.9)', border: 'none',
          borderRadius: 20, padding: '8px 16px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          ← Volver
        </button>

        {/* Miniaturas */}
        {imagenes.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {imagenes.map((_, i) => (
              <button key={i} onClick={() => setImgActiva(i)} style={{
                width: i === imgActiva ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none',
                background: i === imgActiva ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.2s', padding: 0
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* Título y precio */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#2C2C2A', lineHeight: 1.3, flex: 1 }}>
              {pub.titulo}
            </h1>
            <span style={{ background: cat.bg, color: cat.text, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {cat.emoji} {pub.categorias?.nombre}
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 800, color: '#185FA5' }}>
            {formatPrecio(pub.precio)}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#444441', lineHeight: 1.7 }}>
            {pub.descripcion}
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888780' }}>
            Publicado {tiempoAtras(pub.created_at)}
          </p>
        </div>

        {/* Vendedor */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendedor</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {ini}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#2C2C2A' }}>
                  {pub.usuarios?.nombre_completo}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888780' }}>
                  ⭐ {pub.usuarios?.calificacion_promedio?.toFixed(1) || '5.0'} reputación
                </p>
              </div>
            </div>
            <BotonWhatsapp
              numero={pub.usuarios?.whatsapp_numero || pub.whatsapp_contacto}
              titulo={pub.titulo}
            />
          </div>
        </div>

        {/* Mensaje confirmación oferta */}
        {mensajeOferta && (
          <div style={{
            background: mensajeOferta.includes('Error') ? '#FCEBEB' : '#EAF3DE',
            color: mensajeOferta.includes('Error') ? '#A32D2D' : '#3B6D11',
            padding: '12px 16px', borderRadius: 12, marginBottom: 12, fontSize: 14
          }}>
            {mensajeOferta}
          </div>
        )}

        {/* Modal oferta */}
        {mostrarOferta && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 12, border: '2px solid #185FA5' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#2C2C2A' }}>Tu oferta</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                placeholder={`Precio original: ${formatPrecio(pub.precio)}`}
                value={montoOferta}
                onChange={e => setMontoOferta(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D3D1C7'}
              />
              <button
                onClick={enviarOferta}
                disabled={enviandoOferta}
                style={{ padding: '12px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {enviandoOferta ? <Spinner size={16} color="#fff" /> : 'Enviar'}
              </button>
            </div>
            <button onClick={() => setMostrarOferta(false)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#888780', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Botones acción fijos */}
      {!esDueno && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '0.5px solid #D3D1C7',
          padding: '12px 16px 24px', zIndex: 100
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => setMostrarOferta(!mostrarOferta)}
              style={{ padding: '14px', borderRadius: 12, border: '1.5px solid #185FA5', background: '#fff', color: '#185FA5', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Hacer oferta
            </button>
            <button
              onClick={() => navigate('/ofertas')}
              style={{ padding: '14px', borderRadius: 12, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Comprar {formatPrecio(pub.precio)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}