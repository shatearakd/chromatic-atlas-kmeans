import { chroma, type PaletteColor } from '@/lib/color'

export function SwatchList({ palette }: { palette: PaletteColor[] }) {
  return (
    <table className="w-full text-left text-xs">
      <caption className="sr-only">Clustered colors with share of pixels, lightness and chroma</caption>
      <thead className="text-muted-foreground">
        <tr className="border-b">
          <th scope="col" className="py-1.5 font-medium">
            Cluster
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
        {palette.map((color) => (
          <tr key={color.hex + color.proportion} className="border-b border-border/60 last:border-0">
            <td className="py-1.5">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-[3px] ring-1 ring-foreground/10"
                  style={{ backgroundColor: color.hex }}
                />
                {color.hex.toUpperCase()}
              </span>
            </td>
            <td className="py-1.5 text-right">{(color.proportion * 100).toFixed(1)}%</td>
            <td className="py-1.5 text-right">{color.lab[0].toFixed(0)}</td>
            <td className="py-1.5 text-right">{chroma(color.lab).toFixed(0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
