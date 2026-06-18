import { Router } from 'express'

const router = Router()

// Health check — confirms the server is running
router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default router
