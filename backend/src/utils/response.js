export const ok = (res, data, mensaje = 'OK', status = 200) => {
  return res.status(status).json({
    success: true,
    mensaje,
    data
  })
}

export const error = (res, mensaje = 'Error interno', status = 500, detalles = null) => {
  return res.status(status).json({
    success: false,
    mensaje,
    ...(detalles && { detalles })
  })
}

export const paginado = (res, data, total, pagina, limite) => {
  return res.status(200).json({
    success: true,
    data,
    paginacion: {
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite)
    }
  })
}