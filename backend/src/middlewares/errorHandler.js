export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      mensaje: 'Datos inválidos',
      detalles: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensaje: e.message
      }))
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, mensaje: 'Token inválido' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, mensaje: 'Token expirado' })
  }

  return res.status(err.status || 500).json({
    success: false,
    mensaje: err.message || 'Error interno del servidor'
  })
}