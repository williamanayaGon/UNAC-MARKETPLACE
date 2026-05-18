import { Router } from 'express'
import {
  enviarOferta, ofertasRecibidas, ofertasEnviadas,
  aceptarOferta, rechazarOferta, contraoferta
} from '../controllers/ofertas.controller.js'
import { verificarToken } from '../middlewares/auth.js'

const router = Router()

router.use(verificarToken)

router.post('/', enviarOferta)
router.get('/recibidas', ofertasRecibidas)
router.get('/enviadas', ofertasEnviadas)
router.put('/:id/aceptar', aceptarOferta)
router.put('/:id/rechazar', rechazarOferta)
router.put('/:id/contraoferta', contraoferta)

export default router