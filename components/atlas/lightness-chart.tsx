'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LIGHTNESS_BANDS, lightnessDistribution, type PaletteColor } from '@/lib/color'

const config = {
  A: { label: 'Artwork A', color: 'var(--chart-1)' },
  B: { label: 'Artwork B', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function LightnessChart({ paletteA, paletteB }: { paletteA: PaletteColor[]; paletteB: PaletteColor[] }) {
  const distA = lightnessDistribution(paletteA)
  const distB = lightnessDistribution(paletteB)
  const data = LIGHTNESS_BANDS.map((band, i) => ({
    band: band.label,
    A: Math.round(distA[i] * 1000) / 10,
    B: Math.round(distB[i] * 1000) / 10,
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-60 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis dataKey="band" tickLine={false} axisLine={false} fontSize={10} interval={0} />
        <YAxis tickLine={false} axisLine={false} fontSize={10} unit="%" />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => `${config[name as 'A' | 'B'].label}: ${value}%`} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="A" fill="var(--color-A)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="B" fill="var(--color-B)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
