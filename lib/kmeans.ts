import { type Lab, type PaletteColor, type RGB, rgbToHex, rgbToLab } from '@/lib/color'

const SAMPLE_SIZE = 140
const MAX_ITERATIONS = 30
const CONVERGENCE_THRESHOLD = 0.4

export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function squaredDistance(a: Lab, b: Lab) {
  const dl = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  return dl * dl + da * da + db * db
}

export function initializeCentroids(points: Lab[], k: number, random: () => number): Lab[] {
  const centroids: Lab[] = [points[Math.floor(random() * points.length)]]
  const distances = new Float64Array(points.length).fill(Number.POSITIVE_INFINITY)

  while (centroids.length < k) {
    const latest = centroids[centroids.length - 1]
    let total = 0
    for (let i = 0; i < points.length; i++) {
      const d = squaredDistance(points[i], latest)
      if (d < distances[i]) distances[i] = d
      total += distances[i]
    }
    if (total === 0) break
    let target = random() * total
    let index = 0
    for (; index < points.length - 1; index++) {
      target -= distances[index]
      if (target <= 0) break
    }
    centroids.push(points[index])
  }

  return centroids.map((c) => [...c] as Lab)
}

/** K-means++ clustering over CIELAB pixels. Returns clusters sorted by share of pixels. */
export function kmeansPalette(pixels: RGB[], k: number): { palette: PaletteColor[]; labels: Uint8Array } {
  if (!pixels.length) return { palette: [], labels: new Uint8Array(0) }
  const points = pixels.map(rgbToLab)
  const random = seededRandom(1337)
  const centroids = initializeCentroids(points, Math.min(k, points.length), random)
  const assignments = new Int32Array(points.length)

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    for (let i = 0; i < points.length; i++) {
      let best = 0
      let bestDistance = Number.POSITIVE_INFINITY
      for (let c = 0; c < centroids.length; c++) {
        const d = squaredDistance(points[i], centroids[c])
        if (d < bestDistance) {
          bestDistance = d
          best = c
        }
      }
      assignments[i] = best
    }

    const sums = centroids.map(() => [0, 0, 0, 0])
    for (let i = 0; i < points.length; i++) {
      const s = sums[assignments[i]]
      s[0] += points[i][0]
      s[1] += points[i][1]
      s[2] += points[i][2]
      s[3] += 1
    }

    let maxShift = 0
    for (let c = 0; c < centroids.length; c++) {
      const [l, a, b, count] = sums[c]
      if (!count) continue
      const next: Lab = [l / count, a / count, b / count]
      maxShift = Math.max(maxShift, Math.sqrt(squaredDistance(next, centroids[c])))
      centroids[c] = next
    }
    if (maxShift < CONVERGENCE_THRESHOLD) break
  }

  const rgbSums = centroids.map(() => [0, 0, 0, 0])
  for (let i = 0; i < pixels.length; i++) {
    const s = rgbSums[assignments[i]]
    s[0] += pixels[i][0]
    s[1] += pixels[i][1]
    s[2] += pixels[i][2]
    s[3] += 1
  }

  const order = rgbSums
    .map((sum, index) => ({ sum, index }))
    .filter(({ sum }) => sum[3] > 0)
    .sort((a, b) => b.sum[3] - a.sum[3])

  const remap = new Int32Array(centroids.length).fill(-1)
  order.forEach(({ index }, rank) => {
    remap[index] = rank
  })

  const labels = new Uint8Array(pixels.length)
  for (let i = 0; i < pixels.length; i++) labels[i] = remap[assignments[i]]

  const palette = order.map(({ sum: [r, g, b, count] }) => {
    const rgb: RGB = [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
    return { rgb, hex: rgbToHex(rgb), lab: rgbToLab(rgb), proportion: count / pixels.length }
  })

  return { palette, labels }
}

export interface ImageAnalysis {
  palette: PaletteColor[]
  /** Cluster index (into `palette`) for every sampled pixel, row-major. */
  labels: Uint8Array
  width: number
  height: number
}

/** Normalized (0–1) position of the cluster pixel closest to that cluster's spatial center. */
export function clusterAnchor(analysis: ImageAnalysis, cluster: number) {
  const { labels, width, height } = analysis
  let sumX = 0
  let sumY = 0
  let count = 0
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] !== cluster) continue
    sumX += i % width
    sumY += Math.floor(i / width)
    count++
  }
  if (!count) return { x: 0.5, y: 0.5 }
  const cx = sumX / count
  const cy = sumY / count
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] !== cluster) continue
    const d = (i % width - cx) ** 2 + (Math.floor(i / width) - cy) ** 2
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  }
  return { x: ((best % width) + 0.5) / width, y: (Math.floor(best / width) + 0.5) / height }
}

export function clusterAt(analysis: ImageAnalysis, x: number, y: number) {
  const px = Math.min(analysis.width - 1, Math.max(0, Math.floor(x * analysis.width)))
  const py = Math.min(analysis.height - 1, Math.max(0, Math.floor(y * analysis.height)))
  return analysis.labels[py * analysis.width + px]
}

export function proxiedImageUrl(imageUrl: string) {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load artwork image'))
    image.src = src
  })
}

export async function extractPalette(imageUrl: string, k: number): Promise<PaletteColor[]> {
  return (await analyzeImage(imageUrl, k)).palette
}

export async function analyzeImage(imageUrl: string, k: number): Promise<ImageAnalysis> {
  const { pixels, width, height } = await readPixels(imageUrl)
  const { palette, labels } = kmeansPalette(pixels, k)
  return { palette, labels, width, height }
}

/** A deterministic random subset of an artwork's pixels, used by the step-by-step demo. */
export async function samplePixels(imageUrl: string, count: number): Promise<RGB[]> {
  const { pixels } = await readPixels(imageUrl)
  const random = seededRandom(7)
  return Array.from({ length: Math.min(count, pixels.length) }, () => pixels[Math.floor(random() * pixels.length)])
}

async function readPixels(imageUrl: string) {
  const image = await loadImage(proxiedImageUrl(imageUrl))
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas is not supported in this browser')
  context.drawImage(image, 0, 0, width, height)

  const { data } = context.getImageData(0, 0, width, height)
  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }

  return { pixels, width, height }
}
