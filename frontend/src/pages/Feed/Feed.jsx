import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicacionesAPI } from '../../api/publicaciones.api'
import { useAuthStore } from '../../store/authStore'
import { formatPrecio, tiempoAtras, CATEGORIA_ESTILOS, inicialesNombre } from '../../utils/format'
import Navbar from '../../components/layout/Navbar'
import Spinner from '../../components/ui/Spinner'

const Skeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '0.5px solid #D3D1C7', background: '#fff' }}>
        <div style={{ height: 140, background: '#f0efeb', animation: 'pulse 1.5s infinite' }} />
        <div style={{ padding: '10px 12px' }}>
          <div style={{ height: 12, borderRadius: 6, background: '#D3D1C7', marginBottom: 6 }} />
          <div style={{ height: 16, borderRadius: 6, background: '#e8e7e1', width: '60%' }} />
        </div>
      </div>
    ))}
  </div>
)

const TarjetaPublicacion = ({ pub, onClick, favoritos, onToggleFav }) => {
  const cat = CATEGORIA_ESTILOS[pub.categorias?.slug] || CATEGORIA_ESTILOS.objetos
  const img = pub.imagenes_publicacion?.[0]?.url_cloudinary
  const esFav = favoritos.has(pub.id)

  return (
    <div
      onClick={() => onClick(pub.id)}
      style={{
        background: '#fff', borderRadius: 12,
        border: '0.5px solid #D3D1C7', overflow: 'hidden',
        cursor: 'pointer', position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,95,165,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div style={{ position: 'relative', height: 140, background: '#F1EFE8', overflow: 'hidden' }}>
        {img
          ? <img src={img} alt={pub.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📷</div>
        }
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: cat.bg, color: cat.text,
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20
        }}>
          {cat.emoji} {pub.categorias?.nombre}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(pub.id) }}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(255,255,255,0.85)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
            color: esFav ? '#D4537E' : '#888780'
          }}
        >
          {esFav ? '♥' : '♡'}
        </button>
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500, color: '#2C2C2A',
          lineHeight: 1.3, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {pub.titulo}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 700, color: '#185FA5' }}>
          {formatPrecio(pub.precio)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: '#888780' }}>
            ⭐ {pub.usuarios?.calificacion_promedio?.toFixed(1) || '5.0'}
          </span>
          <span style={{ fontSize: 11, color: '#888780' }}>{tiempoAtras(pub.created_at)}</span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#5F5E5A' }}>
          {pub.usuarios?.nombre_completo}
        </p>
      </div>
    </div>
  )
}

export default function Feed() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuthStore()
  const [publicaciones, setPublicaciones] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [favoritos, setFavoritos] = useState(new Set())
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const ini = inicialesNombre(usuario?.nombre_completo)

  useEffect(() => {
    publicacionesAPI.categorias()
      .then(({ data }) => setCategorias(data.data || []))
      .catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = { pagina, limite: 12 }
      if (categoriaActiva) params.categoria = categoriaActiva
      if (busqueda) params.busqueda = busqueda
      const { data } = await publicacionesAPI.listar(params)
      setPublicaciones(data.data || [])
      setTotalPaginas(data.paginacion?.paginas || 1)
    } catch {
      setPublicaciones([])
    } finally {
      setLoading(false)
    }
  }, [categoriaActiva, busqueda, pagina])

  useEffect(() => {
    const t = setTimeout(cargar, busqueda ? 400 : 0)
    return () => clearTimeout(t)
  }, [cargar])

  const toggleFav = (id) => {
    setFavoritos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F1EFE8', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ background: '#0C447C', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, background: '#185FA5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>U</span>
                </div>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>UNAC</p>
                  <p style={{ margin: 0, color: '#85B7EB', fontSize: 11 }}>Marketplace</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {usuario?.rol === 'moderador' || usuario?.rol === 'admin' ? (
                  <button
                    onClick={() => navigate('/moderacion')}
                    style={{ background: '#378ADD', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Moderación
                  </button>
                ) : null}
                <button
                  onClick={() => navigate('/perfil')}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: '#185FA5', border: '2px solid #378ADD', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {ini}
                </button>
              </div>
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: 4 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#B4B2A9' }}>🔍</span>
              <input
                type="search"
                placeholder="Buscar productos o servicios..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  border: 'none', borderRadius: 10,
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Filtros */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px 12px', width: 'max-content' }}>
              {[{ id: null, nombre: 'Todo', slug: 'todo' }, ...categorias].map(c => (
                <button
                  key={c.id ?? 'todo'}
                  onClick={() => { setCategoriaActiva(c.id); setPagina(1) }}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                    borderColor: categoriaActiva === c.id ? '#fff' : 'rgba(255,255,255,0.3)',
                    background: categoriaActiva === c.id ? '#fff' : 'transparent',
                    color: categoriaActiva === c.id ? '#185FA5' : '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {CATEGORIA_ESTILOS[c.slug]?.emoji || ''} {c.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
          {loading ? <Skeleton /> : publicaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888780' }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
              <p style={{ fontWeight: 600, color: '#444441', marginBottom: 4 }}>Sin resultados</p>
              <p style={{ fontSize: 13 }}>Intenta con otra categoría o búsqueda</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {publicaciones.map(p => (
                  <TarjetaPublicacion
                    key={p.id} pub={p}
                    onClick={id => navigate(`/publicacion/${id}`)}
                    favoritos={favoritos}
                    onToggleFav={toggleFav}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #D3D1C7', background: '#fff', color: pagina === 1 ? '#B4B2A9' : '#185FA5', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    ← Anterior
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: 14, color: '#5F5E5A' }}>
                    {pagina} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #D3D1C7', background: '#fff', color: pagina === totalPaginas ? '#B4B2A9' : '#185FA5', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Navbar />
    </>
  )
}