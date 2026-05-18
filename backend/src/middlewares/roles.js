import { error } from '../utils/response.js'

export const soloModerador = (req, res, next) => {
  if (!['moderador', 'admin'].includes(req.usuario?.rol)) {
    return error(res, 'Acceso restringido a moderadores', 403)
  }
  next()
}

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return error(res, 'Acceso restringido a administradores', 403)
  }
  next()
}