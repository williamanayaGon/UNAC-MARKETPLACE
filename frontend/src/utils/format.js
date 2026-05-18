export const formatPrecio = (precio) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(precio)

export const tiempoAtras = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('es-CO')
}

export const inicialesNombre = (nombre) =>
  nombre?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'UN'

export const CATEGORIA_ESTILOS = {
  objetos:   { bg: '#E6F1FB', text: '#185FA5', emoji: '📦' },
  apuntes:   { bg: '#EAF3DE', text: '#3B6D11', emoji: '📝' },
  asesorias: { bg: '#FAEEDA', text: '#854F0B', emoji: '🎓' },
  servicios: { bg: '#FBEAF0', text: '#993556', emoji: '🛠️' },
}