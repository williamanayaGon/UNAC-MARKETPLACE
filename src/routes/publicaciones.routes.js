import { Router } from 'express'
import {
  listar, obtener, crear, editar,
  marcarVendida, misPublicaciones, listarCategorias
} from '../controllers/publicaciones.controller.js'
import { verificarToken } from '../middlewares/auth.js'

const router = Router()

router.get('/', listar)
router.get('/categorias', listarCategorias)
router.get('/mis-publicaciones', verificarToken, misPublicaciones)
router.get('/:id', obtener)
router.post('/', verificarToken, crear)
router.put('/:id', verificarToken, editar)
router.put('/:id/vender', verificarToken, marcarVendida)

export default router