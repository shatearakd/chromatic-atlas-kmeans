export type RGB = [number, number, number]
export type Lab = [number, number, number]

export interface PaletteColor {
  rgb: RGB
  hex: string
  lab: Lab
  proportion: number
}

function srgbToLinear(channel: number) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(channel: number) {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

const REF_X = 0.95047
const REF_Y = 1
const REF_Z = 1.08883

export function rgbToLab([r, g, b]: RGB): Lab {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)

  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / REF_X
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) / REF_Y
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / REF_Z

  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (t * 24389) / 27 / 116 + 16 / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function labToRgb([l, a, b]: Lab): RGB {
  const fy = (l + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27))

  const x = inv(fx) * REF_X
  const y = inv(fy) * REF_Y
  const z = inv(fz) * REF_Z

  return [
    linearToSrgb(x * 3.2404542 + y * -1.5371385 + z * -0.4985314),
    linearToSrgb(x * -0.969266 + y * 1.8760108 + z * 0.041556),
    linearToSrgb(x * 0.0556434 + y * -0.2040259 + z * 1.0572252),
  ]
}

export function rgbToHex([r, g, b]: RGB) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = Number.parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function deltaE(a: Lab, b: Lab) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export function chroma(lab: Lab) {
  return Math.hypot(lab[1], lab[2])
}

export function hueAngle(lab: Lab) {
  const h = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI
  return h < 0 ? h + 360 : h
}

export function readableTextColor(lab: Lab) {
  return lab[0] > 60 ? '#1a1714' : '#faf7f2'
}

export function paletteFromHexes(hexes: string[]): PaletteColor[] {
  return hexes.map((hex) => {
    const rgb = hexToRgb(hex)
    return { rgb, hex, lab: rgbToLab(rgb), proportion: 1 / hexes.length }
  })
}

function directedDistance(from: PaletteColor[], to: PaletteColor[]) {
  const totalWeight = from.reduce((sum, c) => sum + c.proportion, 0) || 1
  return (
    from.reduce((sum, c) => {
      const nearest = Math.min(...to.map((t) => deltaE(c.lab, t.lab)))
      return sum + c.proportion * nearest
    }, 0) / totalWeight
  )
}

/** Weighted, symmetric chamfer distance between two palettes in CIELAB space. */
export function paletteDistance(a: PaletteColor[], b: PaletteColor[]) {
  if (!a.length || !b.length) return Number.POSITIVE_INFINITY
  return (directedDistance(a, b) + directedDistance(b, a)) / 2
}

export function similarityFromDistance(distance: number) {
  if (!Number.isFinite(distance)) return 0
  return Math.round(100 * Math.exp(-distance / 22))
}

export interface ColorMatch {
  source: PaletteColor
  target: PaletteColor
  distance: number
}

export function matchColors(a: PaletteColor[], b: PaletteColor[]): ColorMatch[] {
  return a.map((source) => {
    let best = b[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const candidate of b) {
      const d = deltaE(source.lab, candidate.lab)
      if (d < bestDistance) {
        bestDistance = d
        best = candidate
      }
    }
    return { source, target: best, distance: bestDistance }
  })
}

export interface PaletteStats {
  meanLightness: number
  meanChroma: number
  warmShare: number
  coolShare: number
  neutralShare: number
  contrast: number
}

export function paletteStats(palette: PaletteColor[]): PaletteStats {
  let meanLightness = 0
  let meanChroma = 0
  let warmShare = 0
  let coolShare = 0
  let neutralShare = 0

  for (const c of palette) {
    meanLightness += c.lab[0] * c.proportion
    const cChroma = chroma(c.lab)
    meanChroma += cChroma * c.proportion
    if (cChroma < 10) {
      neutralShare += c.proportion
    } else {
      const h = hueAngle(c.lab)
      if (h < 110 || h >= 330) warmShare += c.proportion
      else coolShare += c.proportion
    }
  }

  const lightness = palette.map((c) => c.lab[0])
  const contrast = lightness.length ? Math.max(...lightness) - Math.min(...lightness) : 0

  return { meanLightness, meanChroma, warmShare, coolShare, neutralShare, contrast }
}

export const LIGHTNESS_BANDS = [
  { label: 'Deep shadow', min: 0, max: 20 },
  { label: 'Shadow', min: 20, max: 40 },
  { label: 'Midtone', min: 40, max: 60 },
  { label: 'Light', min: 60, max: 80 },
  { label: 'Highlight', min: 80, max: 101 },
] as const

export function lightnessDistribution(palette: PaletteColor[]) {
  return LIGHTNESS_BANDS.map((band) =>
    palette
      .filter((c) => c.lab[0] >= band.min && c.lab[0] < band.max)
      .reduce((sum, c) => sum + c.proportion, 0),
  )
}
