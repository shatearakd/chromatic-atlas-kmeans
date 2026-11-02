'use client'

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import type { Artwork } from '@/lib/artworks'
import { type Lab, labToRgb, rgbToHex, rgbToLab } from '@/lib/color'
import { initializeCentroids, samplePixels, seededRandom, squaredDistance } from '@/lib/kmeans'

const SAMPLE_COUNT = 450
const PLOT_SIZE = 320
const MAX_ITERATIONS = 15

type Phase = 'init' | 'assign' | 'update' | 'converged'

interface Step {
  phase: Phase
  iteration: number
  centroids: Lab[]
  previous?: Lab[]
  assignments: Int32Array | null
  meanError?: number
  shift?: number
}

function assign(points: Lab[], centroids: Lab[]) {
  const assignments = new Int32Array(points.length)
  let error = 0
  points.forEach((p, i) => {
    let best = 0
    let bestDistance = Number.POSITIVE_INFINITY
    centroids.forEach((c, j) => {
      const d = squaredDistance(p, c)
      if (d < bestDistance) {
        bestDistance = d
        best = j
      }
    })
    assignments[i] = best
    error += bestDistance
  })
  return { assignments, meanError: error / points.length }
}

function update(points: Lab[], assignments: Int32Array, centroids: Lab[]): Lab[] {
  const sums = centroids.map(() => [0, 0, 0, 0])
  points.forEach((p, i) => {
    const s = sums[assignments[i]]
    s[0] += p[0]
    s[1] += p[1]
    s[2] += p[2]
    s[3] += 1
  })
  return sums.map(([l, a, b, n], i) => (n ? ([l / n, a / n, b / n] as Lab) : centroids[i]))
}

function buildSteps(points: Lab[], k: number): Step[] {
  let centroids = initializeCentroids(points, k, seededRandom(11))
  const steps: Step[] = [{ phase: 'init', iteration: 0, centroids, assignments: null }]
  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    const { assignments, meanError } = assign(points, centroids)
    steps.push({ phase: 'assign', iteration, centroids, assignments, meanError })
    const next = update(points, assignments, centroids)
    const shift = Math.max(...next.map((c, i) => Math.sqrt(squaredDistance(c, centroids[i]))))
    steps.push({ phase: 'update', iteration, centroids: next, previous: centroids, assignments, meanError, shift })
    centroids = next
    if (shift < 0.5) {
      steps.push({ phase: 'converged', iteration, centroids, assignments, meanError, shift })
      break
    }
  }
  return steps
}

const PHASE_COPY: Record<Phase, { title: string; body: string }> = {
  init: {
    title: 'Initialize with k-means++',
    body: 'The first centroid is a random pixel. Each next one is chosen with probability proportional to its squared distance from the nearest existing centroid, so starting colors spread across the palette instead of clumping together.',
  },
  assign: {
    title: 'Assign every pixel',
    body: 'Each pixel joins the centroid it is closest to in CIELAB space. The spokes show which cluster each sampled pixel now belongs to.',
  },
  update: {
    title: 'Move centroids to the mean',
    body: 'Each centroid moves to the average color of the pixels assigned to it. Dashed rings mark where it was a moment ago.',
  },
  converged: {
    title: 'Converged',
    body: 'The centroids have essentially stopped moving, so further iterations would not change the palette. These centroids are the extracted colors.',
  },
}

const centroidHex = (c: Lab) => rgbToHex(labToRgb(c))

export function KmeansStepper({ artwork }: { artwork: Artwork }) {
  const { data: pixels, error } = useSWR(['samples', artwork.imageUrl], ([, url]) => samplePixels(url, SAMPLE_COUNT), {
    revalidateOnFocus: false,
  })
  const [k, setK] = useState(5)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const points = useMemo(() => pixels?.map(rgbToLab) ?? [], [pixels])
  const steps = useMemo(() => (points.length ? buildSteps(points, k) : []), [points, k])
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const atEnd = stepIndex >= steps.length - 1

  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), 900)
    return () => clearTimeout(timer)
  }, [playing, atEnd])

  const extent = useMemo(() => {
    const max = points.reduce((m, p) => Math.max(m, Math.abs(p[1]), Math.abs(p[2])), 20)
    return Math.ceil(max + 6)
  }, [points])

  const project = (lab: Lab) => ({
    x: ((lab[1] + extent) / (extent * 2)) * PLOT_SIZE,
    y: PLOT_SIZE - ((lab[2] + extent) / (extent * 2)) * PLOT_SIZE,
  })

  const changeK = (value: number | readonly number[]) => {
    setK(Array.isArray(value) ? value[0] : (value as number))
    setStepIndex(0)
    setPlaying(false)
  }

  if (error) return <p className="text-sm text-destructive">Could not load the demo painting.</p>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        {!step || !pixels ? (
          <Skeleton className="aspect-square w-full" />
        ) : (
          <svg
            viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
            className="aspect-square w-full rounded-md border bg-background"
            role="img"
            aria-label={`${SAMPLE_COUNT} sampled pixels plotted on the a* and b* axes with ${k} centroids, ${PHASE_COPY[step.phase].title}`}
          >
            <line x1={PLOT_SIZE / 2} x2={PLOT_SIZE / 2} y1={0} y2={PLOT_SIZE} stroke="var(--border)" />
            <line y1={PLOT_SIZE / 2} y2={PLOT_SIZE / 2} x1={0} x2={PLOT_SIZE} stroke="var(--border)" />
            <text x={PLOT_SIZE - 6} y={PLOT_SIZE / 2 - 6} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">
              red (+a*)
            </text>
            <text x={6} y={PLOT_SIZE / 2 - 6} fontSize={9} fill="var(--muted-foreground)">
              green (−a*)
            </text>
            <text x={PLOT_SIZE / 2 + 6} y={12} fontSize={9} fill="var(--muted-foreground)">
              yellow (+b*)
            </text>
            <text x={PLOT_SIZE / 2 + 6} y={PLOT_SIZE - 6} fontSize={9} fill="var(--muted-foreground)">
              blue (−b*)
            </text>

            {step.assignments && (
              <g opacity={0.35}>
                {points.map((p, i) => {
                  const from = project(p)
                  const to = project(step.phase === 'update' && step.previous ? step.previous[step.assignments![i]] : step.centroids[step.assignments![i]])
                  return (
                    <line
                      key={i}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={centroidHex(step.centroids[step.assignments![i]])}
                      strokeWidth={0.6}
                    />
                  )
                })}
              </g>
            )}

            {points.map((p, i) => {
              const { x, y } = project(p)
              return <circle key={i} cx={x} cy={y} r={2.4} fill={rgbToHex(pixels[i])} stroke="rgba(0,0,0,0.25)" strokeWidth={0.4} />
            })}

            {step.phase === 'update' &&
              step.previous?.map((c, i) => {
                const { x, y } = project(c)
                return (
                  <circle
                    key={`prev-${i}`}
                    cx={x}
                    cy={y}
                    r={8}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeDasharray="2 2"
                    opacity={0.6}
                  />
                )
              })}

            {step.centroids.map((c, i) => {
              const { x, y } = project(c)
              return (
                <g
                  key={`c-${i}`}
                  style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 600ms ease-in-out' }}
                >
                  <circle r={10} fill={centroidHex(c)} stroke="var(--background)" strokeWidth={3} />
                  <circle r={10} fill="none" stroke="var(--foreground)" strokeWidth={1.25} />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={9}
                    fontWeight={600}
                    fill={c[0] > 60 ? '#1a1714' : '#faf7f2'}
                  >
                    {i + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
        <p className="text-xs text-muted-foreground">
          {SAMPLE_COUNT} pixels sampled from <span className="italic">{artwork.title}</span>, plotted on the a*/b* plane.
          Lightness (L*) is used in the math but flattened here for display.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="demo-k" className="text-sm font-medium">
              Clusters (k) <span className="ml-1 font-mono tabular-nums text-primary">{k}</span>
            </label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              Step {Math.min(stepIndex, steps.length - 1) + 1} / {steps.length || 1}
            </span>
          </div>
          <Slider id="demo-k" aria-label="Demo cluster count" min={2} max={8} step={1} value={[k]} onValueChange={changeK} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStepIndex(0)
              setPlaying(false)
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft aria-hidden="true" />
            Back
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={atEnd} onClick={() => setStepIndex((i) => i + 1)}>
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button type="button" size="sm" disabled={!steps.length || (atEnd && !playing)} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {playing ? 'Pause' : 'Play'}
          </Button>
        </div>

        {step && (
          <div className="flex flex-col gap-4 rounded-md border bg-background p-4" aria-live="polite">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {step.phase === 'init' ? 'Setup' : `Iteration ${step.iteration}`}
              </span>
              <h4 className="font-serif text-2xl font-semibold">{PHASE_COPY[step.phase].title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{PHASE_COPY[step.phase].body}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Mean squared error</dt>
                <dd className="font-mono text-base tabular-nums">{step.meanError?.toFixed(1) ?? '—'}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Largest centroid shift (ΔE)</dt>
                <dd className="font-mono text-base tabular-nums">{step.shift?.toFixed(2) ?? '—'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-1.5">
              {step.centroids.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-sm border bg-card px-1.5 py-1 font-mono text-[11px] tabular-nums"
                >
                  <span className="size-3 rounded-[2px] ring-1 ring-foreground/10" style={{ backgroundColor: centroidHex(c) }} />
                  {i + 1} · {centroidHex(c).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
