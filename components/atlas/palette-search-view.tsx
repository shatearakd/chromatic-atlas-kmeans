'use client'

import { ScanSearch } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { PALETTE_PRESETS, PaletteBuilder } from '@/components/atlas/palette-builder'
import { PaletteStrip } from '@/components/atlas/palette-strip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { jsonFetcher } from '@/hooks/use-art-data'
import type { Artwork, ArtworkSearchResponse } from '@/lib/artworks'
import { type PaletteColor, paletteDistance, paletteFromHexes, similarityFromDistance } from '@/lib/color'
import { extractPalette } from '@/lib/kmeans'

const POOL_SIZE = 48
const CONCURRENCY = 6
const SCAN_K = 5

interface ScanResult {
  artwork: Artwork
  palette: PaletteColor[]
  score: number
}

interface PaletteSearchViewProps {
  onCompare: (slot: 'A' | 'B', artwork: Artwork) => void
}

export function PaletteSearchView({ onCompare }: PaletteSearchViewProps) {
  const [colors, setColors] = useState<string[]>(PALETTE_PRESETS[0].colors)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<ScanResult[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [status, setStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const runId = useRef(0)

  const scan = async (event: FormEvent) => {
    event.preventDefault()
    const currentRun = ++runId.current
    const target = paletteFromHexes(colors)
    setResults([])
    setStatus('scanning')
    setErrorMessage('')
    setProgress({ done: 0, total: 0 })

    try {
      const params = new URLSearchParams({ random: '1', limit: String(POOL_SIZE) })
      if (keyword.trim()) params.set('q', keyword.trim())
      const { artworks } = await jsonFetcher<ArtworkSearchResponse>(`/api/artworks?${params.toString()}`)
      if (currentRun !== runId.current) return
      if (!artworks.length) throw new Error('No paintings matched that keyword. Try a broader term.')
      setProgress({ done: 0, total: artworks.length })

      const queue = [...artworks]
      const worker = async () => {
        while (queue.length) {
          const artwork = queue.shift()
          if (!artwork) return
          try {
            const palette = await extractPalette(artwork.imageUrl, SCAN_K)
            if (currentRun !== runId.current) return
            const score = similarityFromDistance(paletteDistance(target, palette))
            setResults((prev) => [...prev, { artwork, palette, score }].sort((a, b) => b.score - a.score))
          } catch {
            // Skip images that fail to load; the rest of the sample still ranks.
          }
          if (currentRun !== runId.current) return
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
      if (currentRun === runId.current) setStatus('done')
    } catch (error) {
      if (currentRun !== runId.current) return
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Scan failed')
    }
  }

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={scan} className="flex flex-col gap-6 rounded-md border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl font-semibold">Build a target palette</h2>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Pick up to six colors. We draw a random sample of {POOL_SIZE} public-domain paintings, run k-means (k ={' '}
            {SCAN_K}) on each one in your browser, and rank them by how closely their clusters match your palette in
            CIELAB space.
          </p>
        </div>

        <PaletteBuilder colors={colors} onChange={setColors} />

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="palette-keyword" className="text-sm font-medium">
              Narrow by keyword <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="palette-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. landscape, portrait, Italian"
              className="bg-background"
            />
          </div>
          <Button type="submit" size="lg" disabled={status === 'scanning'}>
            <ScanSearch aria-hidden="true" />
            {status === 'scanning' ? 'Scanning…' : results.length ? 'Scan a new sample' : 'Find matching art'}
          </Button>
        </div>

        {status === 'scanning' && (
          <div className="flex flex-col gap-1.5" aria-live="polite">
            <Progress value={percent} aria-label="Scan progress" />
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {progress.total
                ? `Clustered ${progress.done} of ${progress.total} paintings`
                : 'Drawing a sample from the collection…'}
            </span>
          </div>
        )}
        {status === 'error' && <p className="text-sm text-destructive">{errorMessage}</p>}
      </form>

      {results.length > 0 && (
        <section aria-labelledby="matches-heading" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="matches-heading" className="font-serif text-2xl font-semibold">
              Closest matches
            </h2>
            <span className="text-xs text-muted-foreground">
              {results.length} ranked{status === 'done' ? ` of ${progress.total} sampled` : ''}
            </span>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.slice(0, 12).map((result, index) => (
              <li key={result.artwork.id} className="flex flex-col overflow-hidden rounded-md border bg-card">
                <div className="relative flex h-56 items-center justify-center bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.artwork.imageUrl}
                    alt={`${result.artwork.title} by ${result.artwork.artist}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="absolute top-2 left-2 rounded-sm bg-foreground/85 px-1.5 py-0.5 font-mono text-[11px] text-background tabular-nums">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight">
                        {result.artwork.title}
                      </h3>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{result.artwork.artist}</p>
                      <p className="text-xs text-muted-foreground">{result.artwork.date}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-serif text-3xl font-semibold leading-none tabular-nums">
                        {result.score}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">match</span>
                    </div>
                  </div>
                  <PaletteStrip palette={result.palette} label={`Palette of ${result.artwork.title}`} className="h-6" />
                  <div className="mt-auto flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onCompare('A', result.artwork)}
                    >
                      Compare as A
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onCompare('B', result.artwork)}
                    >
                      Compare as B
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
