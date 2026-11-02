'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PALETTE_PRESETS = [
  { name: 'Venetian Renaissance', colors: ['#7a1f1f', '#c8963e', '#2f3e5c', '#e8d7b0', '#3a2a1e'] },
  { name: 'Dutch Golden Age', colors: ['#1c1a17', '#5a4630', '#a8823f', '#d9c7a0', '#2e3b33'] },
  { name: 'Impressionist Garden', colors: ['#6b8f71', '#a7c4d9', '#e7d27c', '#c97b84', '#f3efe2'] },
  { name: 'Romantic Seascape', colors: ['#2c3e50', '#5d7b8f', '#c9b48a', '#8a6e4b', '#e9e2cf'] },
  { name: 'Rococo Pastel', colors: ['#f2d1c9', '#c9d8e0', '#e8dcb5', '#a7b89a', '#fbf6ee'] },
]

const MAX_COLORS = 6

interface PaletteBuilderProps {
  colors: string[]
  onChange: (colors: string[]) => void
}

export function PaletteBuilder({ colors, onChange }: PaletteBuilderProps) {
  const update = (index: number, value: string) => onChange(colors.map((c, i) => (i === index ? value : c)))
  const remove = (index: number) => onChange(colors.filter((_, i) => i !== index))
  const add = () => onChange([...colors, '#8a7a5c'])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {colors.map((color, index) => (
          <div key={index} className="group relative flex flex-col items-center gap-1.5">
            <label
              className="relative block size-16 cursor-pointer overflow-hidden rounded-sm ring-1 ring-foreground/15 transition-shadow focus-within:ring-2 focus-within:ring-ring sm:size-20"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">Color {index + 1}</span>
              <input
                type="color"
                value={color}
                onChange={(e) => update(index, e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <span className="font-mono text-[11px] uppercase text-muted-foreground">{color}</span>
            {colors.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove color ${color}`}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border bg-card text-muted-foreground opacity-100 shadow-sm transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {colors.length < MAX_COLORS && (
          <Button
            type="button"
            variant="outline"
            onClick={add}
            className="mb-5 size-16 border-dashed sm:size-20"
            aria-label="Add color"
          >
            <Plus aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.colors)}
              className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-xs transition-colors hover:border-primary"
            >
              <span className="flex overflow-hidden rounded-full" aria-hidden="true">
                {preset.colors.map((c) => (
                  <span key={c} className="h-4 w-2.5" style={{ backgroundColor: c }} />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
