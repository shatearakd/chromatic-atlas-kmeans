import type { PaletteColor } from '@/lib/color'
import { cn } from '@/lib/utils'

interface PaletteStripProps {
  palette: PaletteColor[]
  className?: string
  label?: string
}

export function PaletteStrip({ palette, className, label = 'Color distribution' }: PaletteStripProps) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${palette.map((c) => `${c.hex} ${Math.round(c.proportion * 100)}%`).join(', ')}`}
      className={cn('flex h-8 w-full overflow-hidden rounded-sm ring-1 ring-border', className)}
    >
      {palette.map((color) => (
        <div
          key={color.hex + color.proportion}
          className="h-full transition-[flex-grow] duration-500"
          style={{ backgroundColor: color.hex, flexGrow: color.proportion, flexBasis: 0 }}
        />
      ))}
    </div>
  )
}
