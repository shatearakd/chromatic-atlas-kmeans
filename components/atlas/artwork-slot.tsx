'use client'

import { ArrowUpRight, MousePointerClick, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ArtworkPicker } from '@/components/atlas/artwork-picker'
import { type ClusterSelection, InteractiveArtwork, type ViewMode } from '@/components/atlas/interactive-artwork'
import { PaletteStrip } from '@/components/atlas/palette-strip'
import { SwatchList } from '@/components/atlas/swatch-list'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Artwork } from '@/lib/artworks'
import { clusterAnchor, type ImageAnalysis } from '@/lib/kmeans'
import { cn } from '@/lib/utils'

interface ArtworkSlotProps {
  label: 'A' | 'B'
  artwork: Artwork | null
  analysis?: ImageAnalysis
  isAnalyzing: boolean
  error?: Error
  onSelect: (artwork: Artwork | null) => void
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'map', label: 'Cluster map' },
]

export function ArtworkSlot({ label, artwork, analysis, isAnalyzing, error, onSelect }: ArtworkSlotProps) {
  const [mode, setMode] = useState<ViewMode>('original')
  const [selectionState, setSelectionState] = useState<{ source: ImageAnalysis; value: ClusterSelection } | null>(
    null,
  )
  const selection = analysis && selectionState?.source === analysis ? selectionState.value : null

  const select = (value: ClusterSelection | null) => {
    setSelectionState(value && analysis ? { source: analysis, value } : null)
  }

  const selectFromList = (cluster: number) => {
    if (!analysis) return
    if (selection?.cluster === cluster) return select(null)
    select({ cluster, ...clusterAnchor(analysis, cluster) })
  }

  const ready = analysis && !isAnalyzing

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MousePointerClick className="size-3.5" aria-hidden="true" />
                Click the painting to identify a cluster
              </p>
              <div role="group" aria-label="Image view" className="flex rounded-md border bg-muted p-0.5">
                {VIEW_MODES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={mode === option.value}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      'rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors',
                      mode === option.value
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <InteractiveArtwork
              artwork={artwork}
              analysis={ready ? analysis : undefined}
              mode={mode}
              selection={selection}
              onSelect={select}
            />

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
          ) : !ready ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <span className="sr-only">Running k-means clustering</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <PaletteStrip palette={analysis.palette} label={`Palette of ${artwork.title}`} />
              <SwatchList
                palette={analysis.palette}
                selectedIndex={selection?.cluster ?? null}
                onSelect={selectFromList}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
