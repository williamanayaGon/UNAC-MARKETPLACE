import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { ok, error, paginado } from '../utils/response.js'

const publicacionSchema = z.object({
  titulo: z.string().min(3, 'Título muy corto').max(100),
  descripcion: z.string().min(10, 'Descripción muy corta'),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  categoria_id: z.number().int().positive(),
  whatsapp_contacto: z.string().optional(),
  imagenes: z.array(z.string()).min(1, 'Agrega al menos una imagen').max(5),
})

// GET /api/publicaciones — feed público
export const listar = async (req, res, next) => {
  try {
    const { categoria, busqueda, precio_min, precio_max, pagina = 1, limite = 12 } = req.query
    const offset = (Number(pagina) - 1) * Number(limite)

    let query = supabaseAdmin
      .from('publicaciones')
      .select(`
        id, titulo, descripcion, precio, created_at, whatsapp_contacto,
        categorias(id, nombre, slug),
        usuarios!publicaciones_usuario_id_fkey(id, nombre_completo, calificacion_promedio, whatsapp_visible, whatsapp_numero),
        imagenes_publicacion(url_cloudinary, orden)
      `, { count: 'exact' })
      .eq('estado_mod', 'aprobada')
      .eq('estado_pub', 'activa')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limite) - 1)

    if (categoria) query = query.eq('categoria_id', Number(categoria))
    if (busqueda) query = query.ilike('titulo', `%${busqueda}%`)
    if (precio_min) query = query.gte('precio', Number(precio_min))
    if (precio_max) query = query.lte('precio', Number(precio_max))

    const { data, error: err, count } = await query

    if (err) {
      console.error('Supabase error listar:', JSON.stringify(err))
      return error(res, err.message || 'Error obteniendo publicaciones', 500)
    }

    const resultado = (data || []).map(p => ({
      ...p,
      usuarios: p.usuarios ? {
        ...p.usuarios,
        whatsapp_numero: p.usuarios.whatsapp_visible ? p.usuarios.whatsapp_numero : null
      } : null
    }))

    return paginado(res, resultado, count || 0, Number(pagina), Number(limite))
  } catch (err) {
    next(err)
  }
}

// GET /api/publicaciones/:id
export const obtener = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('publicaciones')
      .select(`
        *,
        categorias(id, nombre, slug),
        usuarios!publicaciones_usuario_id_fkey(id, nombre_completo, calificacion_promedio, foto_perfil_url, whatsapp_visible, whatsapp_numero),
        imagenes_publicacion(id, url_cloudinary, orden)
      `)
      .eq('id', req.params.id)
      .single()

    if (err || !data) {
      console.error('Error obtener pub:', JSON.stringify(err))
      return error(res, 'Publicación no encontrada', 404)
    }

    if (data.usuarios && !data.usuarios.whatsapp_visible) {
      data.usuarios.whatsapp_numero = null
    }

    return ok(res, data)
  } catch (err) {
    next(err)
  }
}

// POST /api/publicaciones
export const crear = async (req, res, next) => {
  try {
    const datos = publicacionSchema.parse({
      ...req.body,
      precio: Number(req.body.precio),
      categoria_id: Number(req.body.categoria_id),
    })

    const { data: pub, error: pubError } = await supabaseAdmin
      .from('publicaciones')
      .insert({
        usuario_id: req.usuario.id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        precio: datos.precio,
        categoria_id: datos.categoria_id,
        whatsapp_contacto: datos.whatsapp_contacto || null,
        estado_pub: 'pendiente',
        estado_mod: 'pendiente',
      })
      .select()
      .single()

    if (pubError) {
      console.error('Error crear publicacion:', JSON.stringify(pubError))
      return error(res, 'Error creando publicación', 500)
    }

    if (datos.imagenes?.length) {
      const imagenes = datos.imagenes.map((url, i) => ({
        publicacion_id: pub.id,
        url_cloudinary: url,
        orden: i
      }))
      await supabaseAdmin.from('imagenes_publicacion').insert(imagenes)
    }

    return ok(res, pub, 'Publicación enviada a revisión', 201)
  } catch (err) {
    next(err)
  }
}

// PUT /api/publicaciones/:id — editar propia
export const editar = async (req, res, next) => {
  try {
    const { data: pub } = await supabaseAdmin
      .from('publicaciones')
      .select('usuario_id, estado_mod')
      .eq('id', req.params.id)
      .single()

    if (!pub) return error(res, 'Publicación no encontrada', 404)
    if (pub.usuario_id !== req.usuario.id) return error(res, 'No autorizado', 403)

    const schema = z.object({
      titulo: z.string().min(3).optional(),
      descripcion: z.string().min(10).optional(),
      precio: z.number().positive().optional(),
      whatsapp_contacto: z.string().optional(),
    })

    const datos = schema.parse(req.body)

    const { data: actualizada, error: err } = await supabaseAdmin
      .from('publicaciones')
      .update({ ...datos, estado_mod: 'pendiente', estado_pub: 'pendiente' })
      .eq('id', req.params.id)
      .select()
      .single()

    if (err) return error(res, 'Error actualizando', 500)

    return ok(res, actualizada, 'Publicación reenviada a revisión')
  } catch (err) {
    next(err)
  }
}

// PUT /api/publicaciones/:id/vender
export const marcarVendida = async (req, res, next) => {
  try {
    const { data: pub } = await supabaseAdmin
      .from('publicaciones')
      .select('usuario_id')
      .eq('id', req.params.id)
      .single()

    if (!pub) return error(res, 'Publicación no encontrada', 404)
    if (pub.usuario_id !== req.usuario.id) return error(res, 'No autorizado', 403)

    await supabaseAdmin
      .from('publicaciones')
      .update({ estado_pub: 'vendida' })
      .eq('id', req.params.id)

    return ok(res, null, 'Publicación marcada como vendida')
  } catch (err) {
    next(err)
  }
}

// GET /api/publicaciones/mis-publicaciones
export const misPublicaciones = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('publicaciones')
      .select(`
        id, titulo, precio, estado_pub, estado_mod, motivo_rechazo, created_at,
        imagenes_publicacion(url_cloudinary, orden),
        categorias(nombre, slug)
      `)
      .eq('usuario_id', req.usuario.id)
      .order('created_at', { ascending: false })

    if (err) {
      console.error('Error mis publicaciones:', JSON.stringify(err))
      return error(res, 'Error obteniendo publicaciones', 500)
    }

    return ok(res, data || [])
  } catch (err) {
    next(err)
  }
}

// GET /api/publicaciones/categorias
export const listarCategorias = async (req, res, next) => {
  try {
    const { data, error: err } = await supabaseAdmin
      .from('categorias')
      .select('*')
      .order('id')

    if (err) {
      console.error('Error categorias:', JSON.stringify(err))
      return error(res, 'Error obteniendo categorías', 500)
    }

    return ok(res, data || [])
  } catch (err) {
    next(err)
  }
}