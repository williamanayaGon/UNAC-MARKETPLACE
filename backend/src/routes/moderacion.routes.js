import { Router } from 'express'
import {
  colaRevision, aprobar, rechazar, pedirCorreccion,
  listarReportes, resolverReporte, listarPoliticas,
  stats, suspenderUsuario
} from '../controllers/moderacion.controller.js'
import { verificarToken } from '../middlewares/auth.js'
import { soloModerador } from '../middlewares/roles.js'

const router = Router()

router.use(verificarToken, soloModerador)

router.get('/cola', colaRevision)
router.get('/stats', stats)
router.get('/reportes', listarReportes)
router.get('/politicas', listarPoliticas)
router.put('/:id/aprobar', aprobar)
router.put('/:id/rechazar', rechazar)
router.put('/:id/correccion', pedirCorreccion)
router.put('/reportes/:id/resolver', resolverReporte)
router.put('/usuarios/:id/suspender', suspenderUsuario)

export default router