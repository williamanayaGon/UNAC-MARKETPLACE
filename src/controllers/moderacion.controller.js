import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { ok, error } from '../utils/response.js'

// GET /api/moderacion/cola
export const colaRevision = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('publicaciones')
      .select(`
        *,
        categorias(nombre, slug),
        usuarios!publicaciones_usuario_id_fkey(id, nombre_completo, email, whatsapp_numero, calificacion_promedio),
        imagenes_publicacion(id, url_cloudinary, orden)
      `)
      .eq('estado_mod', 'pendiente')
      .order('created_at', { ascending: true })

    if (err) {
      console.error('Error cola:', JSON.stringify(err))
      return error(res, err.message || 'Error obteniendo cola', 500)
    }

    return ok(res, data || [])
  } catch (err) {
    next(err)
  }
}

// PUT /api/moderacion/:id/aprobar
export const aprobar = async (req, res, next) => {
  try {
    const { data: pub } = await supabaseAdmin
      .from('publicaciones')
      .select('id, estado_mod, usuario_id')
      .eq('id', req.params.id)
      .single()

    if (!pub) return error(res, 'Publicación no encontrada', 404)
    if (pub.estado_mod !== 'pendiente') return error(res, 'Solo se pueden aprobar publicaciones pendientes', 400)

    await supabaseAdmin
      .from('publicaciones')
      .update({
        estado_mod: 'aprobada',
        estado_pub: 'activa',
        moderador_id: req.usuario.id,
        moderado_en: new Date().toISOString()
      })
      .eq('id', req.params.id)

    await supabaseAdmin.from('emails_log').insert({
      usuario_id: pub.usuario_id,
      publicacion_id: pub.id,
      tipo: 'publicacion_aprobada',
      estado_envio: 'pendiente'
    })

    return ok(res, null, 'Publicación aprobada y visible en el feed')
  } catch (err) {
    next(err)
  }
}

// PUT /api/moderacion/:id/rechazar
export const rechazar = async (req, res, next) => {
  try {
    const schema = z.object({
      politica_rechazo_id: z.number().int().positive(),
      motivo_rechazo: z.string().min(5, 'Escribe un motivo más detallado').optional()
    })
    const datos = schema.parse({
      ...req.body,
      politica_rechazo_id: Number(req.body.politica_rechazo_id)
    })

    const { data: pub } = await supabaseAdmin
      .from('publicaciones')
      .select('id, estado_mod, usuario_id')
      .eq('id', req.params.id)
      .single()

    if (!pub) return error(res, 'Publicación no encontrada', 404)
    if (pub.estado_mod !== 'pendiente') return error(res, 'Solo se pueden rechazar publicaciones pendientes', 400)

    const { data: politica } = await supabaseAdmin
      .from('politicas_moderacion')
      .select('titulo')
      .eq('id', datos.politica_rechazo_id)
      .single()

    await supabaseAdmin
      .from('publicaciones')
      .update({
        estado_mod: 'rechazada',
        estado_pub: 'pausada',
        moderador_id: req.usuario.id,
        moderado_en: new Date().toISOString(),
        politica_rechazo_id: datos.politica_rechazo_id,
        motivo_rechazo: datos.motivo_rechazo || politica?.titulo
      })
      .eq('id', req.params.id)

    await supabaseAdmin.from('emails_log').insert({
      usuario_id: pub.usuario_id,
      publicacion_id: pub.id,
      tipo: 'publicacion_rechazada',
      estado_envio: 'pendiente'
    })

    return ok(res, null, 'Publicación rechazada')
  } catch (err) {
    next(err)
  }
}

// PUT /api/moderacion/:id/correccion
export const pedirCorreccion = async (req, res, next) => {
  try {
    const schema = z.object({
      motivo_rechazo: z.string().min(10, 'Describe qué debe corregir el vendedor')
    })
    const datos = schema.parse(req.body)

    await supabaseAdmin
      .from('publicaciones')
      .update({
        estado_mod: 'correccion',
        moderador_id: req.usuario.id,
        moderado_en: new Date().toISOString(),
        motivo_rechazo: datos.motivo_rechazo
      })
      .eq('id', req.params.id)

    return ok(res, null, 'Solicitud de corrección enviada al vendedor')
  } catch (err) {
    next(err)
  }
}

// GET /api/moderacion/reportes
export const listarReportes = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('reportes')
      .select(`
        *,
        usuarios!reportes_reportante_id_fkey(nombre_completo, email),
        publicaciones(
          id, titulo, precio, usuario_id,
          usuarios!publicaciones_usuario_id_fkey(nombre_completo, whatsapp_numero),
          imagenes_publicacion(url_cloudinary)
        )
      `)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })

    if (err) {
      console.error('Error reportes:', JSON.stringify(err))
      return error(res, err.message || 'Error obteniendo reportes', 500)
    }

    return ok(res, data || [])
  } catch (err) {
    next(err)
  }
}

// PUT /api/moderacion/reportes/:id/resolver
export const resolverReporte = async (req, res, next) => {
  try {
    const schema = z.object({
      accion: z.enum(['suspender_publicacion', 'advertir_usuario', 'desestimar']),
      resolucion: z.string().optional()
    })
    const datos = schema.parse(req.body)

    const { data: reporte } = await supabaseAdmin
      .from('reportes')
      .select('*, publicaciones(usuario_id)')
      .eq('id', req.params.id)
      .single()

    if (!reporte) return error(res, 'Reporte no encontrado', 404)

    if (datos.accion === 'suspender_publicacion') {
      await supabaseAdmin
        .from('publicaciones')
        .update({ estado_pub: 'pausada' })
        .eq('id', reporte.publicacion_id)
    }

    if (datos.accion === 'advertir_usuario') {
      await supabaseAdmin.from('emails_log').insert({
        usuario_id: reporte.publicaciones.usuario_id,
        publicacion_id: reporte.publicacion_id,
        tipo: 'advertencia_usuario',
        estado_envio: 'pendiente'
      })
    }

    await supabaseAdmin
      .from('reportes')
      .update({
        estado: datos.accion === 'desestimar' ? 'desestimado' : 'resuelto',
        moderador_id: req.usuario.id,
        resolucion: datos.resolucion || datos.accion,
        resuelto_en: new Date().toISOString()
      })
      .eq('id', req.params.id)

    return ok(res, null, 'Reporte resuelto')
  } catch (err) {
    next(err)
  }
}

// GET /api/moderacion/politicas
export const listarPoliticas = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('politicas_moderacion')
      .select('*')
      .order('id')

    if (err) {
      console.error('Error politicas:', JSON.stringify(err))
      return error(res, err.message || 'Error obteniendo políticas', 500)
    }

    return ok(res, data || [])
  } catch (err) {
    next(err)
  }
}

// GET /api/moderacion/stats
export const stats = async (req, res, next) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const [pendientes, aprobadas, rechazadas, reportes] = await Promise.all([
      supabaseAdmin.from('publicaciones').select('id', { count: 'exact', head: true }).eq('estado_mod', 'pendiente'),
      supabaseAdmin.from('publicaciones').select('id', { count: 'exact', head: true }).eq('estado_mod', 'aprobada').gte('moderado_en', hoy.toISOString()),
      supabaseAdmin.from('publicaciones').select('id', { count: 'exact', head: true }).eq('estado_mod', 'rechazada').gte('moderado_en', hoy.toISOString()),
      supabaseAdmin.from('reportes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    ])

    return ok(res, {
      pendientes: pendientes.count || 0,
      aprobadas_hoy: aprobadas.count || 0,
      rechazadas_hoy: rechazadas.count || 0,
      reportes_pendientes: reportes.count || 0,
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/moderacion/usuarios/:id/suspender
export const suspenderUsuario = async (req, res, next) => {
  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, suspendido')
      .eq('id', req.params.id)
      .single()

    if (!usuario) return error(res, 'Usuario no encontrado', 404)

    await supabaseAdmin
      .from('usuarios')
      .update({ suspendido: !usuario.suspendido })
      .eq('id', req.params.id)

    const accion = usuario.suspendido ? 'reactivado' : 'suspendido'
    return ok(res, null, `Usuario ${accion}`)
  } catch (err) {
    next(err)
  }
}