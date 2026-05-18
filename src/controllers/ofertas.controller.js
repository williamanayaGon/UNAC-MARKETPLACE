import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { ok, error } from '../utils/response.js'

// POST /api/ofertas
export const enviarOferta = async (req, res, next) => {
  try {
    const schema = z.object({
      publicacion_id: z.string().uuid(),
      monto_ofertado: z.number().positive(),
    })
    const datos = schema.parse({
      ...req.body,
      monto_ofertado: Number(req.body.monto_ofertado)
    })

    // Verificar que la publicación existe y está activa
    const { data: pub } = await supabaseAdmin
      .from('publicaciones')
      .select('id, usuario_id, titulo, estado_pub, estado_mod')
      .eq('id', datos.publicacion_id)
      .single()

    if (!pub) return error(res, 'Publicación no encontrada', 404)
    if (pub.estado_mod !== 'aprobada') return error(res, 'Publicación no disponible', 400)
    if (pub.usuario_id === req.usuario.id) return error(res, 'No puedes ofertar en tu propia publicación', 400)

    // Verificar si ya tiene oferta pendiente
    const { data: ofertaExistente } = await supabaseAdmin
      .from('ofertas')
      .select('id')
      .eq('publicacion_id', datos.publicacion_id)
      .eq('comprador_id', req.usuario.id)
      .eq('estado', 'pendiente')
      .single()

    if (ofertaExistente) return error(res, 'Ya tienes una oferta pendiente en esta publicación', 409)

    const { data: oferta, error: err } = await supabaseAdmin
      .from('ofertas')
      .insert({
        publicacion_id: datos.publicacion_id,
        comprador_id: req.usuario.id,
        monto_ofertado: datos.monto_ofertado,
        estado: 'pendiente',
        expira_en: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (err) return error(res, 'Error enviando oferta', 500)

    return ok(res, oferta, 'Oferta enviada. El vendedor tiene 48h para responder', 201)
  } catch (err) {
    next(err)
  }
}

// GET /api/ofertas/recibidas
export const ofertasRecibidas = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('ofertas')
      .select(`
        *,
        publicaciones(id, titulo, precio),
        usuarios!ofertas_comprador_id_fkey(id, nombre_completo, calificacion_promedio)
      `)
      .eq('publicaciones.usuario_id', req.usuario.id)
      .order('created_at', { ascending: false })

    if (err) return error(res, 'Error obteniendo ofertas', 500)

    return ok(res, data)
  } catch (err) {
    next(err)
  }
}

// GET /api/ofertas/enviadas
export const ofertasEnviadas = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('ofertas')
      .select(`
        *,
        publicaciones(id, titulo, precio, imagenes_publicacion(url_cloudinary))
      `)
      .eq('comprador_id', req.usuario.id)
      .order('created_at', { ascending: false })

    if (err) return error(res, 'Error obteniendo ofertas', 500)

    return ok(res, data)
  } catch (err) {
    next(err)
  }
}

// PUT /api/ofertas/:id/aceptar
export const aceptarOferta = async (req, res, next) => {
  try {
    const { data: oferta } = await supabaseAdmin
      .from('ofertas')
      .select('*, publicaciones(usuario_id, titulo)')
      .eq('id', req.params.id)
      .single()

    if (!oferta) return error(res, 'Oferta no encontrada', 404)
    if (oferta.publicaciones.usuario_id !== req.usuario.id) return error(res, 'No autorizado', 403)
    if (oferta.estado !== 'pendiente' && oferta.estado !== 'contraoferta') {
      return error(res, 'Esta oferta no se puede aceptar', 400)
    }

    // Actualizar oferta
    await supabaseAdmin
      .from('ofertas')
      .update({ estado: 'aceptada' })
      .eq('id', req.params.id)

    // Obtener whatsapp del vendedor para enviarlo al comprador
    const { data: vendedor } = await supabaseAdmin
      .from('usuarios')
      .select('whatsapp_numero, nombre_completo')
      .eq('id', req.usuario.id)
      .single()

    return ok(res, {
      oferta_id: oferta.id,
      whatsapp_vendedor: vendedor?.whatsapp_numero,
      mensaje: `Oferta aceptada. Coordina la entrega por WhatsApp: ${vendedor?.whatsapp_numero || 'No disponible'}`
    }, 'Oferta aceptada')
  } catch (err) {
    next(err)
  }
}

// PUT /api/ofertas/:id/rechazar
export const rechazarOferta = async (req, res, next) => {
  try {
    const { data: oferta } = await supabaseAdmin
      .from('ofertas')
      .select('*, publicaciones(usuario_id)')
      .eq('id', req.params.id)
      .single()

    if (!oferta) return error(res, 'Oferta no encontrada', 404)
    if (oferta.publicaciones.usuario_id !== req.usuario.id) return error(res, 'No autorizado', 403)

    await supabaseAdmin
      .from('ofertas')
      .update({ estado: 'rechazada' })
      .eq('id', req.params.id)

    return ok(res, null, 'Oferta rechazada')
  } catch (err) {
    next(err)
  }
}

// PUT /api/ofertas/:id/contraoferta
export const contraoferta = async (req, res, next) => {
  try {
    const schema = z.object({
      monto_contraoferta: z.number().positive()
    })
    const datos = schema.parse({
      monto_contraoferta: Number(req.body.monto_contraoferta)
    })

    const { data: oferta } = await supabaseAdmin
      .from('ofertas')
      .select('*, publicaciones(usuario_id)')
      .eq('id', req.params.id)
      .single()

    if (!oferta) return error(res, 'Oferta no encontrada', 404)
    if (oferta.publicaciones.usuario_id !== req.usuario.id) return error(res, 'No autorizado', 403)
    if (oferta.estado !== 'pendiente') return error(res, 'Solo puedes contraofertear ofertas pendientes', 400)

    await supabaseAdmin
      .from('ofertas')
      .update({
        monto_contraoferta: datos.monto_contraoferta,
        estado: 'contraoferta'
      })
      .eq('id', req.params.id)

    return ok(res, null, 'Contraoferta enviada')
  } catch (err) {
    next(err)
  }
}