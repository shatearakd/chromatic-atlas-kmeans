'use client'

import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import type { PaletteColor } from '@/lib/color'

interface Point {
  a: number
  b: number
  share: number
  hex: string
  series: 'A' | 'B'
}

const config = {
  A: { label: 'Artwork A', color: 'var(--chart-1)' },
  B: { label: 'Artwork B', color: 'var(--chart-2)' },
} satisfies ChartConfig

function toPoints(palette: PaletteColor[], series: 'A' | 'B'): Point[] {
  return palette.map((c) => ({ a: c.lab[1], b: c.lab[2], share: c.proportion, hex: c.hex, series }))
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: Point
}

function Dot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload) return null
  const r = 5 + Math.sqrt(payload.share) * 22
  return payload.series === 'A' ? (
    <circle cx={cx} cy={cy} r={r} fill={payload.hex} stroke="var(--foreground)" strokeWidth={1.5} />
  ) : (
    <rect
      x={cx - r}
      y={cy - r}
      width={r * 2}
      height={r * 2}
      rx={2}
      fill={payload.hex}
      stroke="var(--foreground)"
      strokeWidth={1.5}
      strokeDasharray="3 2"
    />
  )
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <div className="flex items-center gap-2 font-medium">
        <span className="size-3 rounded-[2px]" style={{ backgroundColor: point.hex }} aria-hidden="true" />
        {point.hex.toUpperCase()} · Artwork {point.series}
      </div>
      <div className="mt-0.5 font-mono text-muted-foreground tabular-nums">
        a* {point.a.toFixed(1)} · b* {point.b.toFixed(1)} · {(point.share * 100).toFixed(1)}%
      </div>
    </div>
  )
}

export function ColorSpaceChart({ paletteA, paletteB }: { paletteA: PaletteColor[]; paletteB: PaletteColor[] }) {
  const pointsA = toPoints(paletteA, 'A')
  const pointsB = toPoints(paletteB, 'B')
  const extent = Math.max(30, ...[...pointsA, ...pointsB].flatMap((p) => [Math.abs(p.a), Math.abs(p.b)])) + 8
  const domain: [number, number] = [-Math.ceil(extent), Math.ceil(extent)]

  return (
    <ChartContainer config={config} className="aspect-auto h-80 w-full">
      <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="a"
          domain={domain}
          tickLine={false}
          axisLine={false}
          fontSize={10}
          label={{ value: 'green ← a* → red', position: 'insideBottom', offset: -6, fontSize: 10 }}
        />
        <YAxis
          type="number"
          dataKey="b"
          domain={domain}
          tickLine={false}
          axisLine={false}
          fontSize={10}
          width={36}
          label={{ value: 'blue ← b* → yellow', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10 }}
        />
        <ReferenceLine x={0} stroke="var(--border)" />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip content={<PointTooltip />} cursor={false} />
        <Scatter name="Artwork A" data={pointsA} shape={<Dot />} isAnimationActive={false} />
        <Scatter name="Artwork B" data={pointsB} shape={<Dot />} isAnimationActive={false} />
      </ScatterChart>
    </ChartContainer>
  )
}
