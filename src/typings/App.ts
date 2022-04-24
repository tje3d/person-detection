interface DetectedObject {
  x: number
  y: number
  w: number
  h: number
  name: string
  confidence: string
}

interface TrackedObject {
  id: number
  x: number
  y: number
  w: number
  h: number
  name: string
  confidence: number
  bearing?: number
  isZombie: boolean
}
