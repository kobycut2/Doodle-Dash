import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import router from './routes'

const app = express()
const PORT = process.env.PORT || 3001

// In production, redirect HTTP → HTTPS (hosting providers set x-forwarded-proto)
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.url}`)
      return
    }
    next()
  })
}

// HSTS — tell browsers to always use HTTPS for this domain
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Shared-secret check on all /api routes except /health
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') return next()
  const key = req.headers['x-api-key']
  if (!key || key !== process.env.API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

app.use('/api', router)

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
