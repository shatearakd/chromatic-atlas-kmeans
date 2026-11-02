'use client'

import { ArtworkSlot } from '@/components/atlas/artwork-slot'
import { ComparisonPanel } from '@/components/atlas/comparison-panel'
import { Slider } from '@/components/ui/slider'
import { useImageAnalysis } from '@/hooks/use-art-data'
import type { Artwork } from '@/lib/artworks'

interface CompareViewProps {
  artworkA: Artwork | null
  artworkB: Artwork | null
  k: number
  onKChange: (k: number) => void
  onSelectA: (artwork: Artwork | null) => void
  onSelectB: (artwork: Artwork | null) => void
}

export function CompareView({ artworkA, artworkB, k, onKChange, onSelectA, onSelectB }: CompareViewProps) {
  const analysisA = useImageAnalysis(artworkA?.imageUrl, k)
  const analysisB = useImageAnalysis(artworkB?.imageUrl, k)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex flex-col gap-0.5 sm:w-64">
          <label htmlFor="k-slider" className="text-sm font-medium">
            Clusters (k) <span className="ml-1 font-mono tabular-nums text-primary">{k}</span>
          </label>
          <span className="text-xs text-muted-foreground">Number of dominant colors k-means extracts</span>
        </div>
        <Slider
          id="k-slider"
          aria-label="Number of clusters"
          min={3}
          max={10}
          step={1}
          value={[k]}
          onValueChange={(value) => onKChange(Array.isArray(value) ? value[0] : value)}
          className="sm:max-w-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ArtworkSlot
          label="A"
          artwork={artworkA}
          analysis={analysisA.data}
          isAnalyzing={analysisA.isLoading}
          error={analysisA.error}
          onSelect={onSelectA}
        />
        <ArtworkSlot
          label="B"
          artwork={artworkB}
          analysis={analysisB.data}
          isAnalyzing={analysisB.isLoading}
          error={analysisB.error}
          onSelect={onSelectB}
        />
      </div>

      {analysisA.data && analysisB.data && artworkA && artworkB ? (
        <ComparisonPanel paletteA={analysisA.data.palette} paletteB={analysisB.data.palette} />
      ) : (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Select a painting for both A and B to see the palette comparison.
        </p>
      )}
    </div>
  )
}
