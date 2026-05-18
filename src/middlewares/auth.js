import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase.js'
import { error } from '../utils/response.js'

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token requerido', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar que el usuario existe y no está suspendido
    const { data: usuario, error: err } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, rol, suspendido')
      .eq('id', decoded.id)
      .single()

    if (err || !usuario) return error(res, 'Usuario no encontrado', 401)
    if (usuario.suspendido) return error(res, 'Cuenta suspendida', 403)

    req.usuario = usuario
    next()
  } catch (err) {
    next(err)
  }
}