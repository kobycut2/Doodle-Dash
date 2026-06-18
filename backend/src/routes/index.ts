import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'
const CHUNK_SIZE = 45
const CHUNK_OVERLAP = 2
const ROTATIONS = [-20, -10, 0, 10, 20]

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

function rotatePoints(
  points: Array<[number, number]>,
  angleDeg: number
): Array<[number, number]> {
  if (angleDeg === 0) return points
  const angle = (angleDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length
  return points.map(([lng, lat]) => [
    cx + (lng - cx) * cos - (lat - cy) * sin,
    cy + (lng - cx) * sin + (lat - cy) * cos,
  ])
}

function scoreMatch(
  waypoints: Array<[number, number]>,
  routeCoords: Array<[number, number]>
): number {
  const sample = routeCoords.filter((_, i) => i % 4 === 0)
  if (sample.length === 0) return Infinity
  return waypoints.reduce((sum, wp) => {
    const minD = sample.reduce((m, rc) => {
      const d = (wp[0] - rc[0]) ** 2 + (wp[1] - rc[1]) ** 2
      return d < m ? d : m
    }, Infinity)
    return sum + minD
  }, 0) / waypoints.length
}

async function routeChunk(
  coords: Array<[number, number]>,
  apiKey: string
): Promise<Array<[number, number]>> {
  const response = await axios.post(
    ORS_URL,
    {
      coordinates: coords,
      continue_straight: true,
      radiuses: Array(coords.length).fill(200),
    },
    { headers: { Authorization: apiKey } }
  )
  return response.data.features[0].geometry.coordinates as Array<[number, number]>
}

// Chunks run sequentially within each rotation so max concurrent ORS
// requests = number of rotations (5), not rotations × chunks (15).
async function routeCandidate(
  points: Array<[number, number]>,
  apiKey: string
): Promise<Array<[number, number]> | null> {
  const chunks: Array<Array<[number, number]>> = []
  let i = 0
  while (i < points.length) {
    const chunk = points.slice(i, i + CHUNK_SIZE)
    if (chunk.length >= 2) chunks.push(chunk)
    if (i + CHUNK_SIZE >= points.length) break
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  if (chunks.length === 0) return null

  try {
    const allCoords: Array<[number, number]> = []
    for (let j = 0; j < chunks.length; j++) {
      const seg = await routeChunk(chunks[j], apiKey)
      allCoords.push(...(j === 0 ? seg : seg.slice(1)))
    }
    return allCoords
  } catch (err: any) {
    const status = err.response?.status
    const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message
    console.error(`Candidate failed [HTTP ${status}]:`, msg)
    return null
  }
}

router.post('/route', async (req: Request, res: Response) => {
  const { points } = req.body as { points: Array<[number, number]> }

  if (!points || points.length < 2) {
    res.status(400).json({ error: 'At least 2 points required' })
    return
  }

  const apiKey = process.env.ORS_API_KEY!

  try {
    // Rotations run in parallel; within each rotation chunks are sequential.
    // This caps concurrent ORS calls at 5 instead of 15.
    const results = await Promise.all(
      ROTATIONS.map(async (angle) => {
        const rotated = rotatePoints(points, angle)
        const coords = await routeCandidate(rotated, apiKey)
        if (!coords) return null
        return { angle, score: scoreMatch(points, coords), coords }
      })
    )

    const valid = results.filter(Boolean) as Array<{
      angle: number
      score: number
      coords: Array<[number, number]>
    }>

    if (valid.length === 0) {
      res.status(500).json({ error: 'No valid routes found — try a different location or shorter text.' })
      return
    }

    const best = valid.reduce((b, c) => (c.score < b.score ? c : b))
    console.log(
      `${valid.length}/${ROTATIONS.length} rotations succeeded. Best: ${best.angle}° (score ${best.score.toFixed(8)})`
    )

    res.json({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: best.coords },
        properties: { rotation: best.angle },
      }],
    })
  } catch (err: any) {
    console.error('Route error:', JSON.stringify(err.response?.data, null, 2))
    const message = err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message
    res.status(500).json({ error: message })
  }
})

export default router
