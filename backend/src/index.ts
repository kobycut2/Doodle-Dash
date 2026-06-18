import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware — runs on every request before it hits a route
app.use(cors())           // allows the Vue frontend to talk to this server
app.use(express.json())   // parses incoming JSON request bodies

// All routes live under /api
app.use('/api', router)

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
