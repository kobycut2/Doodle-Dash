import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'
const CHUNK_SIZE = 45
const CHUNK_OVERLAP = 2

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

async function routeChunk(coords: Array<[number, number]>, apiKey: string): Promise<Array<[number, number]>> {
  const res = await axios.post(
    ORS_URL,
    {
      coordinates: coords,
      continue_straight: false,
      radiuses: Array(coords.length).fill(-1),
    },
    { headers: { Authorization: apiKey } }
  )
  return res.data.features[0].geometry.coordinates
}

async function routeSegment(pts: Array<[number, number]>, apiKey: string): Promise<Array<[number, number]> | null> {
  if (pts.length < 2) return null
  const chunks: Array<Array<[number, number]>> = []
  let i = 0
  while (i < pts.length) {
    const chunk = pts.slice(i, i + CHUNK_SIZE)
    if (chunk.length >= 2) chunks.push(chunk)
    if (i + CHUNK_SIZE >= pts.length) break
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  if (chunks.length === 0) return null
  try {
    const all: Array<[number, number]> = []
    for (let j = 0; j < chunks.length; j++) {
      const seg = await routeChunk(chunks[j], apiKey)
      all.push(...(j === 0 ? seg : seg.slice(1)))
    }
    return all
  } catch (err: any) {
    console.error(`Segment routing failed [${err.response?.status}]:`, err.response?.data?.error?.message ?? err.message)
    return null
  }
}

router.post('/route', async (req: Request, res: Response) => {
  const { letters } = req.body as { letters: Array<Array<[number, number]>> }
  const valid = (letters ?? []).filter(l => l.length >= 2)

  if (valid.length === 0) {
    res.status(400).json({ error: 'No valid letter data received.' })
    return
  }

  const apiKey = process.env.ORS_API_KEY!
  const allCoords: Array<[number, number]> = []

  try {
    // Route each letter as its own ORS call so ORS focuses on one letter's
    // shape at a time rather than routing through all letters at once.
    // Sequential calls avoid hitting rate limits.
    for (let i = 0; i < valid.length; i++) {
      if (allCoords.length > 0) {
        // Connect baseline-exit of the previous letter to baseline-entry of this one.
        // Use the actual last road coordinate (not intended waypoint) as the origin
        // so the connection starts from where the route truly ended.
        const from = allCoords.at(-1)!
        const to   = valid[i][0]
        try {
          const conn = await routeChunk([from, to], apiKey)
          allCoords.push(...conn.slice(1))
        } catch {
          console.error(`Connection ${i - 1}→${i} failed`)
        }
      }

      const seg = await routeSegment(valid[i], apiKey)
      if (!seg) {
        console.error(`Letter ${i} failed — skipping`)
        continue
      }
      allCoords.push(...(allCoords.length === 0 ? seg : seg.slice(1)))
    }

    if (allCoords.length < 2) {
      res.status(500).json({ error: 'Could not route any letters — try tapping a different spot on the map.' })
      return
    }

    console.log(`Routed ${valid.length} letters, ${allCoords.length} road coords`)

    res.json({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: allCoords },
        properties: {},
      }],
    })
  } catch (err: any) {
    console.error('Route error:', err.response?.data ?? err.message)
    const msg = err.response?.data?.error?.message ?? err.message
    res.status(500).json({ error: msg })
  }
})

export default router
