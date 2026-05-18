import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { ok, error } from '../utils/response.js'

const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre_completo: z.string().min(2, 'Nombre muy corto'),
  whatsapp_numero: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const registro = async (req, res, next) => {
  try {
    const datos = registroSchema.parse(req.body)

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: datos.email,
      password: datos.password,
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return error(res, 'Este email ya está registrado', 409)
      }
      return error(res, authError.message, 400)
    }

    // Crear perfil en tabla usuarios
    const { data: usuario, error: perfilError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: datos.email,
        nombre_completo: datos.nombre_completo,
        whatsapp_numero: datos.whatsapp_numero || null,
        rol: 'usuario'
      })
      .select()
      .single()

    if (perfilError) return error(res, 'Error creando perfil', 500)

    const token = generarToken(usuario)

    return ok(res, { token, usuario }, 'Registro exitoso', 201)
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const datos = loginSchema.parse(req.body)

    // Autenticar con Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: datos.email,
      password: datos.password
    })

    if (authError) return error(res, 'Email o contraseña incorrectos', 401)

    // Obtener perfil
    const { data: usuario, error: perfilError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (perfilError || !usuario) return error(res, 'Perfil no encontrado', 404)
    if (usuario.suspendido) return error(res, 'Cuenta suspendida', 403)

    const token = generarToken(usuario)

    return ok(res, { token, usuario }, 'Login exitoso')
  } catch (err) {
    next(err)
  }
}

export const perfil = async (req, res, next) => {
  try {
    const { data: usuario, error: err } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre_completo, foto_perfil_url, whatsapp_numero, whatsapp_visible, rol, calificacion_promedio, created_at')
      .eq('id', req.usuario.id)
      .single()

    if (err) return error(res, 'Error obteniendo perfil', 500)

    return ok(res, usuario)
  } catch (err) {
    next(err)
  }
}

export const actualizarPerfil = async (req, res, next) => {
  try {
    const schema = z.object({
      nombre_completo: z.string().min(2).optional(),
      whatsapp_numero: z.string().optional(),
      whatsapp_visible: z.boolean().optional(),
      foto_perfil_url: z.string().url().optional(),
    })

    const datos = schema.parse(req.body)

    const { data: usuario, error: err } = await supabaseAdmin
      .from('usuarios')
      .update(datos)
      .eq('id', req.usuario.id)
      .select()
      .single()

    if (err) return error(res, 'Error actualizando perfil', 500)

    return ok(res, usuario, 'Perfil actualizado')
  } catch (err) {
    next(err)
  }
}