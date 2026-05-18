import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicacionesAPI } from '../../api/publicaciones.api'
import { formatPrecio } from '../../utils/format'
import Spinner from '../../components/ui/Spinner'

export default function CrearPublicacion() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({
    titulo: '', descripcion: '', precio: '',
    categoria_id: '', whatsapp_contacto: '', imagenes: []
  })
  const [imagenesPreview, setImagenesPreview] = useState([])
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    publicacionesAPI.categorias()
      .then(({ data }) => setCategorias(data.data || []))
  }, [])

  const handleImagen = (e) => {
    const archivos = Array.from(e.target.files)
    if (form.imagenes.length + archivos.length > 5) {
      setErrorMsg('Máximo 5 fotos')
      return
    }
    // Preview local
    archivos.forEach(archivo => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagenesPreview(prev => [...prev, ev.target.result])
        setForm(prev => ({ ...prev, imagenes: [...prev.imagenes, ev.target.result] }))
      }
      reader.readAsDataURL(archivo)
    })
  }

  const eliminarImagen = (i) => {
    setImagenesPreview(prev => prev.filter((_, idx) => idx !== i))
    setForm(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, idx) => idx !== i) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.imagenes.length === 0) { setErrorMsg('Agrega al menos una foto'); return }
    setCargando(true)
    setErrorMsg('')
    try {
      await publicacionesAPI.crear({
        ...form,
        precio: Number(form.precio),
        categoria_id: Number(form.categoria_id),
      })
      setExito(true)
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error creando publicación')
    } finally {
      setCargando(false)
    }
  }

  if (exito) return (
    <div style={{ minHeight: '100vh', background: '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <p style={{ fontSize: 56, margin: '0 0 16px' }}>✅</p>
        <h2 style={{ margin: '0 0 8px', color: '#2C2C2A' }}>¡Publicación enviada!</h2>
        <p style={{ color: '#888780', fontSize: 14, marginBottom: 24 }}>
          Tu publicación está en revisión. Te notificaremos por correo cuando sea aprobada.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: '14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          Volver al feed
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F1EFE8', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: '#0C447C', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>Nueva publicación</h1>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>

        {/* Aviso moderación */}
        <div style={{ background: '#FAEEDA', border: '1px solid #EF9F27', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <span>ℹ️</span>
          <p style={{ margin: 0, fontSize: 13, color: '#633806' }}>
            Tu publicación será revisada por un moderador antes de aparecer en el feed.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Fotos */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#2C2C2A', fontSize: 15 }}>
              Fotos <span style={{ color: '#888780', fontWeight: 400, fontSize: 13 }}>(máx. 5)</span>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {imagenesPreview.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                  <button
                    type="button"
                    onClick={() => eliminarImagen(i)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#E24B4A', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
              {imagenesPreview.length < 5 && (
                <label style={{ width: 80, height: 80, border: '2px dashed #D3D1C7', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888780', fontSize: 12, gap: 4 }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  Agregar
                  <input type="file" accept="image/*" multiple onChange={handleImagen} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          {/* Campos */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>Título</label>
              <input
                type="text" placeholder="Ej: Libro de Cálculo II — 8va Ed."
                value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                required maxLength={100}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D3D1C7'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>Categoría</label>
              <select
                value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none', background: '#fff' }}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>Precio en COP</label>
              <input
                type="number" placeholder="0" min="0"
                value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D3D1C7'}
              />
              {form.precio && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#185FA5', fontWeight: 600 }}>{formatPrecio(Number(form.precio))}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>Descripción</label>
              <textarea
                placeholder="Describe tu producto o servicio..."
                value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                required rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D3D1C7'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444441', marginBottom: 6 }}>
                WhatsApp de contacto <span style={{ color: '#888780', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="tel" placeholder="3001234567"
                value={form.whatsapp_contacto} onChange={e => setForm({ ...form, whatsapp_contacto: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #D3D1C7', fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D3D1C7'}
              />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888780' }}>Visible para compradores y moderador</p>
            </div>
          </div>

          <button
            type="submit" disabled={cargando}
            style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: cargando ? '#B5D4F4' : '#185FA5', color: '#fff', fontSize: 16, fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {cargando ? <><Spinner size={20} color="#fff" /> Enviando...</> : 'Enviar a revisión'}
          </button>
        </form>
      </div>
    </div>
  )
}