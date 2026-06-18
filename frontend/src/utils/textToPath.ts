type Pt = [number, number]

// Single-stroke uppercase alphabet in normalized 0-1 coordinate space.
// null means pen-lift — ORS will route between those points on real roads.
const LETTERS: Record<string, Array<Pt | null>> = {
  'A': [[0,0], [0.5,1], [1,0], null, [0.15,0.4], [0.85,0.4]],
  'B': [[0,0], [0,1], [0.6,1], [0.9,0.85], [0.6,0.5], [0,0.5], [0.6,0.5], [0.9,0.15], [0.6,0], [0,0]],
  'C': [[0.9,0.8], [0.6,1], [0.1,0.8], [0,0.5], [0.1,0.2], [0.6,0], [0.9,0.2]],
  'D': [[0,0], [0,1], [0.6,1], [1,0.7], [1,0.3], [0.6,0], [0,0]],
  'E': [[1,1], [0,1], [0,0], [1,0], null, [0,0.5], [0.7,0.5]],
  'F': [[1,1], [0,1], [0,0], null, [0,0.5], [0.7,0.5]],
  'G': [[0.9,0.8], [0.6,1], [0.1,0.8], [0,0.5], [0.1,0.2], [0.6,0], [0.9,0.2], [1,0.5], [0.5,0.5]],
  'H': [[0,0], [0,1], null, [1,0], [1,1], null, [0,0.5], [1,0.5]],
  'I': [[0,0], [1,0], null, [0.5,0], [0.5,1], null, [0,1], [1,1]],
  'J': [[0,0.2], [0.2,0], [0.8,0], [1,0.2], [1,1], null, [0.2,1], [0.8,1]],
  'K': [[0,0], [0,1], null, [0.9,1], [0,0.45], [0.9,0]],
  'L': [[0,1], [0,0], [1,0]],
  'M': [[0,0], [0,1], [0.5,0.5], [1,1], [1,0]],
  'N': [[0,0], [0,1], [1,0], [1,1]],
  'O': [[0.5,0], [0.1,0.2], [0,0.5], [0.1,0.8], [0.5,1], [0.9,0.8], [1,0.5], [0.9,0.2], [0.5,0]],
  'P': [[0,0], [0,1], [0.6,1], [1,0.85], [1,0.65], [0.6,0.5], [0,0.5]],
  'Q': [[0.5,0], [0.1,0.2], [0,0.5], [0.1,0.8], [0.5,1], [0.9,0.8], [1,0.5], [0.9,0.2], [0.5,0], null, [0.6,0.2], [1,0]],
  'R': [[0,0], [0,1], [0.6,1], [1,0.85], [1,0.65], [0.6,0.5], [0,0.5], [0.6,0.5], [1,0]],
  'S': [[0.9,0.8], [0.7,1], [0.1,0.9], [0,0.7], [0.1,0.5], [0.9,0.5], [1,0.3], [0.9,0.1], [0.3,0], [0.1,0.2]],
  'T': [[0,1], [1,1], null, [0.5,1], [0.5,0]],
  'U': [[0,1], [0,0.2], [0.5,0], [1,0.2], [1,1]],
  'V': [[0,1], [0.5,0], [1,1]],
  'W': [[0,1], [0.25,0], [0.5,0.5], [0.75,0], [1,1]],
  'X': [[0,0], [1,1], null, [1,0], [0,1]],
  'Y': [[0,1], [0.5,0.5], [1,1], null, [0.5,0.5], [0.5,0]],
  'Z': [[0,1], [1,1], [0,0], [1,0]],
  ' ': [],
}

const LETTER_WIDTH = 1
const LETTER_SPACING = 0.4

function densify(
  points: Array<{ x: number; y: number }>,
  maxStep: number
): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = []
  for (let i = 0; i < points.length; i++) {
    result.push(points[i])
    if (i < points.length - 1) {
      const a = points[i], b = points[i + 1]
      const dx = b.x - a.x, dy = b.y - a.y
      const steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) / maxStep)
      for (let s = 1; s < steps; s++) {
        const t = s / steps
        result.push({ x: a.x + dx * t, y: a.y + dy * t })
      }
    }
  }
  return result
}

export function textToPoints(text: string): Array<{ x: number; y: number }> {
  const raw: Array<{ x: number; y: number }> = []
  let xOffset = 0

  for (const char of text.toUpperCase()) {
    const letterDef = LETTERS[char] ?? []
    for (const pt of letterDef) {
      if (pt !== null) {
        raw.push({ x: xOffset + pt[0] * LETTER_WIDTH, y: pt[1] })
      }
    }
    xOffset += LETTER_WIDTH + LETTER_SPACING
  }

  return raw
}

export function scalePointsToLatLng(
  points: Array<{ x: number; y: number }>,
  centerLat: number,
  centerLng: number,
  distanceMiles: number
): Array<[number, number]> {
  if (points.length === 0) return []

  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const span = Math.max(maxX - minX, maxY - minY)

  const targetKm = distanceMiles * 1.60934 * 0.5
  const degreesLat = targetKm / 111
  const latPerUnit = degreesLat / span
  const lngPerUnit = latPerUnit / Math.cos(centerLat * Math.PI / 180)

  return points.map(({ x, y }) => [
    centerLng + (x - cx) * lngPerUnit,
    centerLat + (y - cy) * latPerUnit,
  ])
}
