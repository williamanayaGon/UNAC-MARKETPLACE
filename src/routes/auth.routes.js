import { Router } from 'express'
import { registro, login, perfil, actualizarPerfil } from '../controllers/auth.controller.js'
import { verificarToken } from '../middlewares/auth.js'

const router = Router()

router.post('/registro', registro)
router.post('/login', login)
router.get('/perfil', verificarToken, perfil)
router.put('/perfil', verificarToken, actualizarPerfil)

export default router