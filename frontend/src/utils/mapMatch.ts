const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking'

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = (b[1] - a[1]) * Math.PI / 180
  const dLng = (b[0] - a[0]) * Math.PI / 180
  const c =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

// Insert interpolated waypoints so no segment exceeds maxMeters.
// Denser guidance forces the router to follow the drawn shape rather than
// cutting freely across open gaps between sparse RDP keypoints.
function densifyWaypoints(pts: Array<[number, number]>, maxMeters = 100): Array<[number, number]> {
  if (pts.length < 2) return pts
  const out: Array<[number, number]> = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const dist = haversineMeters(pts[i - 1], pts[i])
    if (dist > maxMeters) {
      const n = Math.ceil(dist / maxMeters)
      for (let j = 1; j <= n; j++) {
        const t = j / n
        out.push([
          pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
        ])
      }
    } else {
      out.push(pts[i])
    }
  }
  return out
}

// Directions API limit is 25 waypoints. Chunk with 1-point overlap so seams are exact.
async function routeWaypoints(
  waypoints: Array<[number, number]>,
  token: string
): Promise<Array<[number, number]> | null> {
  if (waypoints.length < 2) return null

  if (waypoints.length > 25) {
    const all: Array<[number, number]> = []
    for (let i = 0; i < waypoints.length - 1; i += 24) {
      const chunk = waypoints.slice(i, Math.min(i + 25, waypoints.length))
      if (chunk.length < 2) break
      const result = await routeWaypoints(chunk, token)
      if (!result) return null
      all.push(...(i === 0 ? result : result.slice(1)))
    }
    return all
  }

  const coordStr = waypoints.map(([lng, lat]) => `${lng.toFixed(7)},${lat.toFixed(7)}`).join(';')
  const url = `${MAPBOX_DIRECTIONS_URL}/${coordStr}?geometries=geojson&overview=full&access_token=${token}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok || !data.routes?.length) {
      console.error(`Directions ${res.status}:`, data.message ?? data.code ?? data)
      return null
    }
    return data.routes[0].geometry.coordinates
  } catch (e) {
    console.error('Directions error:', e)
    return null
  }
}

export function routeLengthMiles(coords: Array<[number, number]>): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) total += haversineMeters(coords[i - 1], coords[i])
  return total / 1609.34
}

export async function matchLetters(
  letters: Array<Array<Array<[number, number]>>>,
  token: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ type: string; features: any[] } | null> {
  // Flatten all letter strokes into one ordered waypoint sequence
  const waypoints: Array<[number, number]> = []
  for (const letter of letters) {
    for (const stroke of letter) {
      waypoints.push(...stroke)
    }
  }

  if (waypoints.length < 2) return null

  const coords = await routeWaypoints(waypoints, token)
  onProgress?.(letters.length, letters.length)

  if (!coords || coords.length < 2) return null

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    }],
  }
}

export async function matchDrawingViaBackend(
  letters: Array<Array<Array<[number, number]>>>,
  onProgress?: (done: number, total: number) => void
): Promise<{ type: string; features: any[] } | null> {
  // Each letter may have multiple strokes — flatten strokes within each letter
  // into one waypoint sequence so the backend routes each letter as a unit.
  const flatLetters = letters
    .map(letter => {
      const pts = letter.flat()
      // Straight-line strokes have exactly 2 RDP keypoints — densifying them
      // causes zigzag as adjacent waypoints snap to different parallel streets.
      // Only densify curved strokes (3+ keypoints) where shape guidance matters.
      return pts.length > 2 ? densifyWaypoints(pts) : pts
    })
    .filter(pts => pts.length >= 2)

  if (flatLetters.length === 0) return null

  try {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letters: flatLetters }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Backend route error:', data.error)
      return null
    }

    onProgress?.(flatLetters.length, flatLetters.length)
    return data as { type: string; features: any[] }
  } catch (e) {
    console.error('Backend route fetch failed:', e)
    return null
  }
}
