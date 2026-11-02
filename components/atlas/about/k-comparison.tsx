'use client'

import { useEffect, useRef } from 'react'
import { PaletteStrip } from '@/components/atlas/palette-strip'
import { Skeleton } from '@/components/ui/skeleton'
import { useImageAnalysis } from '@/hooks/use-art-data'
import type { Artwork } from '@/lib/artworks'
import { type ImageAnalysis, proxiedImageUrl } from '@/lib/kmeans'

const K_VALUES = [
  { k: 3, note: 'Broad tonal structure: background, figure, shadow.' },
  { k: 6, note: 'Major color families emerge, e.g. a dress against a wall.' },
  { k: 10, note: 'Accents surface — small but meaningful notes of color.' },
]

function ClusterMap({ analysis, label }: { analysis: ImageAnalysis; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const { width, height, labels, palette } = analysis
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return
    const image = context.createImageData(width, height)
    for (let i = 0; i < labels.length; i++) {
      const [r, g, b] = palette[labels[i]].rgb
      image.data.set([r, g, b, 255], i * 4)
    }
    context.putImageData(image, 0, 0)
  }, [analysis])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className="h-full w-auto max-w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

function KPanel({ artwork, k, note }: { artwork: Artwork; k: number; note: string }) {
  const { data } = useImageAnalysis(artwork.imageUrl, k)
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-56 items-center justify-center rounded-sm bg-muted">
        {data ? (
          <ClusterMap analysis={data} label={`${artwork.title} redrawn with ${k} cluster colors`} />
        ) : (
          <Skeleton className="size-full" />
        )}
      </div>
      {data && <PaletteStrip palette={data.palette} className="h-4" label={`k = ${k} palette`} />}
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-mono text-sm tabular-nums">k = {k}</span>
        <span className="text-xs text-muted-foreground">{note}</span>
      </figcaption>
    </figure>
  )
}

export function KComparison({ artwork }: { artwork: Artwork }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <figure className="flex flex-col gap-2">
        <div className="flex h-56 items-center justify-center rounded-sm bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedImageUrl(artwork.imageUrl)}
            alt={`${artwork.title} by ${artwork.artist}`}
            className="h-full w-auto max-w-full object-contain"
          />
        </div>
        <div className="h-4" aria-hidden="true" />
        <figcaption className="flex flex-col gap-0.5">
          <span className="font-mono text-sm">Original</span>
          <span className="text-xs text-muted-foreground">Thousands of distinct pixel colors.</span>
        </figcaption>
      </figure>
      {K_VALUES.map(({ k, note }) => (
        <KPanel key={k} artwork={artwork} k={k} note={note} />
      ))}
    </div>
  )
}
