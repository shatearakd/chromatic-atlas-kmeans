'use client'

import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { ArtworkPicker } from '@/components/atlas/artwork-picker'
import { PaletteStrip } from '@/components/atlas/palette-strip'
import { SwatchList } from '@/components/atlas/swatch-list'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Artwork } from '@/lib/artworks'
import type { PaletteColor } from '@/lib/color'
import { proxiedImageUrl } from '@/lib/kmeans'

interface ArtworkSlotProps {
  label: 'A' | 'B'
  artwork: Artwork | null
  palette?: PaletteColor[]
  isAnalyzing: boolean
  error?: Error
  onSelect: (artwork: Artwork | null) => void
}

export function ArtworkSlot({ label, artwork, palette, isAnalyzing, error, onSelect }: ArtworkSlotProps) {
  return (
    <section aria-labelledby={`slot-${label}`} className="flex flex-col gap-4 rounded-md border bg-card p-4 sm:p-5">
      <header className="flex items-center justify-between gap-2">
        <h2 id={`slot-${label}`} className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-semibold italic leading-none text-primary">{label}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {artwork ? 'Analyzed work' : 'Choose a work'}
          </span>
        </h2>
        {artwork && (
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            <RotateCcw aria-hidden="true" />
            Change
          </Button>
        )}
      </header>

      {!artwork ? (
        <ArtworkPicker slotLabel={`artwork ${label}`} onSelect={onSelect} />
      ) : (
        <div className="flex flex-col gap-4">
          <figure className="flex flex-col gap-3">
            <div className="flex h-72 items-center justify-center overflow-hidden rounded-sm bg-muted sm:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxiedImageUrl(artwork.imageUrl)}
                alt={`${artwork.title} by ${artwork.artist}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <figcaption className="flex flex-col gap-0.5">
              <span className="font-serif text-xl font-semibold leading-tight text-balance">{artwork.title}</span>
              <span className="text-sm text-muted-foreground">{artwork.artist}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{artwork.date}</span>
                {artwork.technique && <span aria-hidden="true">·</span>}
                {artwork.technique && <span>{artwork.technique}</span>}
                <a
                  href={artwork.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
                >
                  Museum record
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              </span>
            </figcaption>
          </figure>

          {error ? (
            <p className="text-sm text-destructive">Could not analyze this image: {error.message}</p>
          ) : !palette || isAnalyzing ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <span className="sr-only">Running k-means clustering</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <PaletteStrip palette={palette} label={`Palette of ${artwork.title}`} />
              <SwatchList palette={palette} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
