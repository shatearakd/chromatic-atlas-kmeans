'use client'

import { ColorSpaceChart } from '@/components/atlas/color-space-chart'
import { LightnessChart } from '@/components/atlas/lightness-chart'
import { PaletteStrip } from '@/components/atlas/palette-strip'
import {
  matchColors,
  type PaletteColor,
  paletteDistance,
  paletteStats,
  similarityFromDistance,
} from '@/lib/color'

interface ComparisonPanelProps {
  paletteA: PaletteColor[]
  paletteB: PaletteColor[]
}

function verdict(score: number) {
  if (score >= 75) return 'Near-identical palettes'
  if (score >= 55) return 'Closely related palettes'
  if (score >= 35) return 'Some shared color families'
  if (score >= 18) return 'Mostly distinct palettes'
  return 'Strongly contrasting palettes'
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function ComparisonPanel({ paletteA, paletteB }: ComparisonPanelProps) {
  const distance = paletteDistance(paletteA, paletteB)
  const score = similarityFromDistance(distance)
  const statsA = paletteStats(paletteA)
  const statsB = paletteStats(paletteB)
  const matches = matchColors(paletteA, paletteB)

  const rows = [
    { label: 'Mean lightness (L*)', a: statsA.meanLightness.toFixed(1), b: statsB.meanLightness.toFixed(1) },
    { label: 'Mean chroma', a: statsA.meanChroma.toFixed(1), b: statsB.meanChroma.toFixed(1) },
    { label: 'Tonal range (ΔL*)', a: statsA.contrast.toFixed(1), b: statsB.contrast.toFixed(1) },
    { label: 'Warm hues', a: percent(statsA.warmShare), b: percent(statsB.warmShare) },
    { label: 'Cool hues', a: percent(statsA.coolShare), b: percent(statsB.coolShare) },
    { label: 'Neutrals', a: percent(statsA.neutralShare), b: percent(statsB.neutralShare) },
  ]

  return (
    <section aria-labelledby="comparison-heading" className="flex flex-col gap-6 rounded-md border bg-card p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-end">
        <div className="flex flex-col gap-1">
          <h2 id="comparison-heading" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Palette similarity
          </h2>
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-7xl font-semibold leading-none tabular-nums">{score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </p>
          <p className="font-serif text-xl italic">{verdict(score)}</p>
          <p className="text-xs text-muted-foreground">
            Weighted mean ΔE*ab between nearest clusters:{' '}
            <span className="font-mono tabular-nums text-foreground">{distance.toFixed(1)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="w-4 font-serif text-lg font-semibold italic text-primary">A</span>
            <PaletteStrip palette={paletteA} label="Palette A" className="h-10" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 font-serif text-lg font-semibold italic text-primary">B</span>
            <PaletteStrip palette={paletteB} label="Palette B" className="h-10" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Chromatic plane (a* × b*)</h3>
          <p className="text-xs text-muted-foreground">
            Each cluster centroid in CIELAB. Size is pixel share; circles are A, dashed squares are B.
          </p>
          <ColorSpaceChart paletteA={paletteA} paletteB={paletteB} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Tonal distribution</h3>
          <p className="text-xs text-muted-foreground">Share of pixels falling in each lightness band.</p>
          <LightnessChart paletteA={paletteA} paletteB={paletteB} />
          <table className="mt-2 w-full text-xs">
            <caption className="sr-only">Summary statistics for both palettes</caption>
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-1.5 text-left font-medium">
                  Metric
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  A
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  B
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-1.5 text-left font-normal">
                    {row.label}
                  </th>
                  <td className="py-1.5 text-right font-mono tabular-nums">{row.a}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Nearest color pairs</h3>
          <p className="text-xs text-muted-foreground">
            For each cluster in A, its closest counterpart in B. ΔE under ~10 reads as the same color family.
          </p>
          <ul className="flex flex-col gap-1.5">
            {matches.map(({ source, target, distance: d }) => (
              <li key={source.hex + source.proportion} className="flex items-center gap-3 text-xs">
                <span className="flex overflow-hidden rounded-sm ring-1 ring-border">
                  <span className="size-7" style={{ backgroundColor: source.hex }} aria-hidden="true" />
                  <span className="size-7" style={{ backgroundColor: target.hex }} aria-hidden="true" />
                </span>
                <span className="font-mono tabular-nums">
                  {source.hex.toUpperCase()} → {target.hex.toUpperCase()}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${Math.max(4, 100 - Math.min(100, d * 2))}%` }}
                    />
                  </span>
                  <span className="w-16 text-right font-mono whitespace-nowrap tabular-nums">ΔE {d.toFixed(1)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
