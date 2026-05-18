export default function BotonWhatsapp({ numero, titulo, estilo = {} }) {
  if (!numero) return null

  const mensaje = encodeURIComponent(
    `Hola, vi tu publicacion "${titulo}" en UNAC Marketplace y me interesa`
  )
  const url = `https://wa.me/57${numero.replace(/\D/g, '')}?text=${mensaje}`

  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: '#25D366', color: '#fff', padding: '10px 18px',
      borderRadius: 10, fontWeight: 600, fontSize: 14,
      textDecoration: 'none', ...estilo
    }}>
      WhatsApp
    </a>
  )
}