import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './src/middlewares/errorHandler.js'
import authRoutes from './src/routes/auth.routes.js'
import publicacionesRoutes from './src/routes/publicaciones.routes.js'
import ofertasRoutes from './src/routes/ofertas.routes.js'
import moderacionRoutes from './src/routes/moderacion.routes.js'

dotenv.config()
//codigo
const app = express()

// ── Seguridad
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// ── Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { success: false, mensaje: 'Demasiadas solicitudes, intenta más tarde' }
}))

// ── Parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── Rutas
app.use('/api/auth', authRoutes)
app.use('/api/publicaciones', publicacionesRoutes)
app.use('/api/ofertas', ofertasRoutes)
app.use('/api/moderacion', moderacionRoutes)

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, mensaje: 'UNAC Marketplace API corriendo', version: '1.0.0' })
})

// ── 404
app.use((req, res) => {
  res.status(404).json({ success: false, mensaje: `Ruta ${req.path} no encontrada` })
})

// ── Error handler global
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`)
})

export default app