import { Workbench } from '@/components/atlas/workbench'

export default function Page() {
  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between md:py-14">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Color analytics for the public domain</p>
            <h1 className="font-serif text-5xl font-semibold leading-[0.95] text-balance sm:text-6xl">
              Chromatic <span className="italic">Atlas</span>
            </h1>
            <p className="text-pretty text-muted-foreground">
              Cluster the pigments of classical paintings with k-means, compare two masterworks side by side, or
              search the collection for works that share your palette.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-xs md:text-right">
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-muted-foreground">Source</dt>
              <dd className="font-medium">Cleveland Museum of Art</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-muted-foreground">License</dt>
              <dd className="font-medium">CC0 Open Access</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-muted-foreground">Color space</dt>
              <dd className="font-medium">CIELAB (D65)</dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Workbench />
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          Artwork data and images from the{' '}
          <a
            href="https://openaccess-api.clevelandart.org/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Cleveland Museum of Art Open Access API
          </a>
          , released under CC0. Palettes are computed in your browser with k-means++ on downsampled pixels.
        </div>
      </footer>
    </div>
  )
}
