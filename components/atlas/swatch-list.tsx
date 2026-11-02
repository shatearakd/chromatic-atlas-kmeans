import { chroma, type PaletteColor } from '@/lib/color'
import { cn } from '@/lib/utils'

interface SwatchListProps {
  palette: PaletteColor[]
  selectedIndex?: number | null
  onSelect?: (index: number) => void
}

export function SwatchList({ palette, selectedIndex = null, onSelect }: SwatchListProps) {
  return (
    <table className="w-full text-left text-xs">
      <caption className="sr-only">
        Clustered colors with RGB value, share of pixels, lightness and chroma. Select a cluster to highlight it in the
        painting.
      </caption>
      <thead className="text-muted-foreground">
        <tr className="border-b">
          <th scope="col" className="py-1.5 font-medium">
            Cluster
          </th>
          <th scope="col" className="hidden py-1.5 font-medium sm:table-cell">
            RGB
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Share
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            L*
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Chroma
          </th>
        </tr>
      </thead>
      <tbody className="font-mono tabular-nums">
        {palette.map((color, index) => {
          const isSelected = selectedIndex === index
          return (
            <tr
              key={color.hex + color.proportion}
              className={cn(
                'border-b border-border/60 transition-colors last:border-0',
                isSelected && 'bg-accent',
                selectedIndex !== null && !isSelected && 'text-muted-foreground',
              )}
            >
              <td className="py-1">
                <button
                  type="button"
                  onClick={() => onSelect?.(index)}
                  aria-pressed={isSelected}
                  className="flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-4 shrink-0 rounded-[3px] ring-1 ring-foreground/10',
                      isSelected && 'ring-2 ring-foreground',
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.hex.toUpperCase()}
                </button>
              </td>
              <td className="hidden py-1 sm:table-cell">{color.rgb.join(', ')}</td>
              <td className="py-1 text-right">{(color.proportion * 100).toFixed(1)}%</td>
              <td className="py-1 text-right">{color.lab[0].toFixed(0)}</td>
              <td className="py-1 text-right">{chroma(color.lab).toFixed(0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
