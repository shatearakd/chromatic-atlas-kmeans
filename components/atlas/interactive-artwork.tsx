'use client'

import { Check, Copy, X } from 'lucide-react'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import type { Artwork } from '@/lib/artworks'
import { clusterAt, type ImageAnalysis, proxiedImageUrl } from '@/lib/kmeans'
import { cn } from '@/lib/utils'

export type ViewMode = 'original' | 'map'

export interface ClusterSelection {
  cluster: number
  x: number
  y: number
}

interface InteractiveArtworkProps {
  artwork: Artwork
  analysis?: ImageAnalysis
  mode: ViewMode
  selection: ClusterSelection | null
  onSelect: (selection: ClusterSelection | null) => void
}

export function InteractiveArtwork({ artwork, analysis, mode, selection, onSelect }: InteractiveArtworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectedCluster = selection?.cluster ?? null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analysis) return
    const { width, height, labels, palette } = analysis
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return

    const image = context.createImageData(width, height)
    const { data } = image
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]
      const isSelected = selectedCluster === null || label === selectedCluster
      const offset = i * 4
      if (mode === 'map') {
        const [r, g, b] = palette[label].rgb
        data[offset] = r
        data[offset + 1] = g
        data[offset + 2] = b
        data[offset + 3] = isSelected ? 255 : 45
      } else if (selectedCluster !== null && !isSelected) {
        data[offset] = 18
        data[offset + 1] = 14
        data[offset + 2] = 10
        data[offset + 3] = 185
      }
    }
    context.putImageData(image, 0, 0)
  }, [analysis, mode, selectedCluster])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!analysis) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const cluster = clusterAt(analysis, x, y)
    onSelect(selection?.cluster === cluster && mode === 'original' && isNear(selection, x, y) ? null : { cluster, x, y })
  }

  const color = selection && analysis ? analysis.palette[selection.cluster] : null

  return (
    <div className="flex h-72 items-center justify-center rounded-sm bg-muted sm:h-80">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users select clusters from the list below the image */}
      <div
        className={cn('relative max-h-full max-w-full', analysis ? 'cursor-crosshair' : 'cursor-progress')}
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxiedImageUrl(artwork.imageUrl)}
          alt={`${artwork.title} by ${artwork.artist}`}
          className="block h-auto max-h-72 w-auto max-w-full select-none sm:max-h-80"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full transition-opacity"
          style={{ imageRendering: mode === 'map' ? 'pixelated' : 'auto' }}
        />

        {selection && color && analysis && (
          <ClusterPopover
            key={`${selection.cluster}-${selection.x}-${selection.y}`}
            selection={selection}
            clusterCount={analysis.palette.length}
            hex={color.hex}
            rgb={color.rgb}
            share={color.proportion}
            onClose={() => onSelect(null)}
          />
        )}
      </div>
    </div>
  )
}

function isNear(selection: ClusterSelection, x: number, y: number) {
  return Math.hypot(selection.x - x, selection.y - y) < 0.03
}

interface ClusterPopoverProps {
  selection: ClusterSelection
  clusterCount: number
  hex: string
  rgb: [number, number, number]
  share: number
  onClose: () => void
}

function ClusterPopover({ selection, clusterCount, hex, rgb, share, onClose }: ClusterPopoverProps) {
  const alignRight = selection.x > 0.55
  const alignAbove = selection.y > 0.55
  const rgbText = `rgb(${rgb.join(', ')})`

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
        style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%`, backgroundColor: hex }}
      />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops clicks from reaching the image */}
      <div
        role="status"
        className={cn(
          'absolute z-10 w-52 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95',
          alignRight ? '-translate-x-full -ml-3' : 'ml-3',
          alignAbove ? '-translate-y-full -mt-3' : 'mt-3',
        )}
        style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="size-9 shrink-0 rounded-sm ring-1 ring-foreground/15" style={{ backgroundColor: hex }} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Cluster {selection.cluster + 1} of {clusterCount}
              </span>
              <span className="font-mono text-xs tabular-nums">{(share * 100).toFixed(1)}% of pixels</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cluster details"
            className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <dl className="mt-3 flex flex-col gap-1">
          <CopyRow label="HEX" value={hex.toUpperCase()} />
          <CopyRow label="RGB" value={rgbText} />
        </dl>
      </div>
    </>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-sm bg-muted px-2 py-1">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className="font-mono text-xs tabular-nums">{value}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} value ${value}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
        </button>
      </dd>
    </div>
  )
}
