type Pt = [number, number]

const LETTERS: Record<string, Array<Pt | null>> = {
  'A': [[0,0], [0,1], [0,0.5], [1,0.5], [1,1], [1,0]],
  'B': [[0,0], [0,1], [0.7,1], [0.7,0.5], [0,0.5], [0.7,0.5], [0.7,0], [0,0]],
  'C': [[1,0.8], [0.5,1], [0,0.8], [0,0.2], [0.5,0], [1,0.2]],
  'D': [[0,0], [0,1], [0.6,1], [1,0.7], [1,0.3], [0.6,0], [0,0]],
  'E': [[1,1], [0,1], [0,0], [1,0], null, [0,0.5], [0.7,0.5]],
  'F': [[0,0], [0,1], [1,1], null, [0,0.5], [0.7,0.5]],
  'G': [[1,0.8], [0.5,1], [0,0.8], [0,0.2], [0.5,0], [1,0.2], [1,0.5], [0.5,0.5]],
  'H': [[0,0], [0,1], [0,0.5], [1,0.5], [1,0], [1,1]],
  'I': [[0,0], [1,0], [0.5,0], [0.5,1], [0,1], [1,1]],
  'J': [[0,0.2], [0.2,0], [0.8,0], [1,0.2], [1,1], [0.2,1], [0.8,1]],
  'K': [[0,0], [0,1], [0.9,1], [0,0.45], [0.9,0]],
  'L': [[0,1], [0,0], [1,0]],
  'M': [[0,0], [0,1], [0.5,0.5], [1,1], [1,0]],
  'N': [[0,0], [0,1], [1,0], [1,1]],
  'O': [[0,0], [0,1], [1,1], [1,0], [0,0]],
  'P': [[0,0], [0,1], [0.7,1], [0.7,0.5], [0,0.5]],
  'Q': [[0,0], [0,1], [1,1], [1,0], [0,0], null, [0.6,0.3], [1,0]],
  'R': [[0,0], [0,1], [0.7,1], [0.7,0.5], [0,0.5], [0.7,0.5], [1,0]],
  'S': [[1,0], [0,0], [0,0.5], [1,0.5], [1,1], [0,1]],
  'T': [[0,1], [1,1], [0.5,1], [0.5,0]],
  'U': [[0,1], [0,0], [1,0], [1,1]],
  'V': [[0,1], [0.5,0], [1,1]],
  'W': [[0,1], [0.25,0], [0.5,0.5], [0.75,0], [1,1]],
  'X': [[0,0], [1,1], [0.5,0.5], [0,1], [1,0]],
  'Y': [[0,1], [0.5,0.5], [0.5,0], null, [0.5,0.5], [1,1]],
  'Z': [[0,1], [1,1], [0,0], [1,0]],
  ' ': [],
}

const LETTER_WIDTH = 1
const LETTER_SPACING = 0.3

function letterPathLength(def: Array<Pt | null>): number {
  let len = 0
  let prev: Pt | null = null
  for (const pt of def) {
    if (pt && prev) len += Math.sqrt((pt[0] - prev[0]) ** 2 + (pt[1] - prev[1]) ** 2)
    prev = pt ?? null
  }
  return len
}

// Returns letters → strokes → points. Each null in the definition splits a new stroke.
function textToLetterGroups(text: string): {
  groups: Array<Array<Array<{ x: number; y: number }>>>
  totalPathUnits: number
} {
  const groups: Array<Array<Array<{ x: number; y: number }>>> = []
  let xOffset = 0
  let totalPathUnits = 0

  const chars = text.toUpperCase().split('')
  for (let ci = 0; ci < chars.length; ci++) {
    const char = chars[ci]
    const letterDef = LETTERS[char] ?? []
    const strokes: Array<Array<{ x: number; y: number }>> = []
    let current: Array<{ x: number; y: number }> = []

    for (const pt of letterDef) {
      if (pt === null) {
        if (current.length >= 2) strokes.push(current)
        current = []
      } else {
        current.push({ x: xOffset + pt[0] * LETTER_WIDTH, y: pt[1] })
      }
    }
    if (current.length >= 2) strokes.push(current)

    if (strokes.length > 0) {
      groups.push(strokes)
      totalPathUnits += letterPathLength(letterDef)
      if (ci < chars.length - 1) totalPathUnits += LETTER_SPACING
    }

    xOffset += LETTER_WIDTH + LETTER_SPACING
  }

  return { groups, totalPathUnits }
}

// Returns per-stroke letter groups from a freehand drawing.
// Each stroke becomes its own "letter" so the routing backend can
// handle each stroke independently and connect them with proper road transitions.
// Return type: Array<Array<Array<[number, number]>>>
//   outer  = letters (one per stroke)
//   middle = strokes within that letter (always one element here)
//   inner  = [lng, lat] pairs
export function drawnStrokesToScaledLetterGroups(
  rawStrokes: Array<Array<{ x: number; y: number }>>,
  centerLat: number,
  centerLng: number,
  distanceMiles: number
): Array<Array<Array<[number, number]>>> {
  const valid = rawStrokes.filter(s => s.length >= 2)
  if (valid.length === 0) return []

  const allPts = valid.flat()
  const xs = allPts.map(p => p.x)
  const ys = allPts.map(p => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2

  // Estimate total path length in canvas units for scaling
  let totalUnits = 0
  for (const stroke of valid) {
    for (let i = 1; i < stroke.length; i++) {
      const dx = stroke[i].x - stroke[i - 1].x
      const dy = stroke[i].y - stroke[i - 1].y
      totalUnits += Math.sqrt(dx * dx + dy * dy)
    }
  }
  if (totalUnits === 0) return []

  const targetKm = (distanceMiles * 1.60934) / 3
  const latPerUnit = (targetKm / 111) / totalUnits
  const lngPerUnit = latPerUnit / Math.cos(centerLat * Math.PI / 180)

  return valid.map(stroke => [
    stroke.map(({ x, y }) => [
      centerLng + (x - cx) * lngPerUnit,
      centerLat - (y - cy) * latPerUnit,
    ] as [number, number])
  ])
}

// Returns letters → strokes → [lng, lat] pairs
export function textToScaledLetterGroups(
  text: string,
  centerLat: number,
  centerLng: number,
  distanceMiles: number
): Array<Array<Array<[number, number]>>> {
  const { groups, totalPathUnits } = textToLetterGroups(text)
  if (groups.length === 0) return []

  const allPts = groups.flat(2)
  const xs = allPts.map(p => p.x)
  const ys = allPts.map(p => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2

  const targetKm = (distanceMiles * 1.60934) / 3
  const latPerUnit = (targetKm / 111) / totalPathUnits
  const lngPerUnit = latPerUnit / Math.cos(centerLat * Math.PI / 180)

  return groups.map(letter =>
    letter.map(stroke =>
      stroke.map(({ x, y }) => [
        centerLng + (x - cx) * lngPerUnit,
        centerLat + (y - cy) * latPerUnit,
      ] as [number, number])
    )
  )
}
