export default function Spinner({ size = 24, color = '#185FA5' }) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        width: size, height: size,
        border: `3px solid rgba(255,255,255,0.3)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
        flexShrink: 0
      }} />
    </>
  )
}