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
