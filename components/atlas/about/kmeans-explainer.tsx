import { KComparison } from '@/components/atlas/about/k-comparison'
import { KmeansStepper } from '@/components/atlas/about/kmeans-stepper'
import type { Artwork } from '@/lib/artworks'

export const DEMO_ARTWORK: Artwork = {
  id: 0,
  title: 'Portrait of Dora Wheeler',
  artist: 'William Merritt Chase (American, 1849–1916)',
  date: '1882–83',
  culture: 'America',
  technique: 'oil on canvas',
  imageUrl: 'https://openaccess-cdn.clevelandart.org/1921.1239/1921.1239_web.jpg',
  width: 0,
  height: 0,
  pageUrl: 'https://clevelandart.org/art/1921.1239',
}

const ALGORITHM_STEPS = [
  {
    title: 'Sample',
    body: 'The painting is downscaled to about 140 px on its longest side, yielding roughly 10–20 thousand pixels. Fine brushwork averages out, but the color structure survives.',
  },
  {
    title: 'Convert to CIELAB',
    body: 'RGB is how screens store color, not how eyes perceive it. In CIELAB, equal distances correspond to roughly equal perceived differences, so “nearest color” means something visual.',
  },
  {
    title: 'Assign',
    body: 'Every pixel is attached to the closest of the k centroids, measured by Euclidean distance (ΔE*ab).',
  },
  {
    title: 'Update and repeat',
    body: 'Centroids move to the mean of their pixels. Assign and update alternate until centroids move less than 0.4 ΔE, or 30 iterations pass.',
  },
]

const ART_USES = [
  {
    title: 'Period and school signatures',
    body: 'Caravaggesque tenebrism clusters into deep shadows with a few warm flesh tones; Impressionist canvases spread across high-key, high-chroma clusters. Palettes make these tendencies measurable instead of anecdotal.',
  },
  {
    title: 'Pigment history',
    body: 'The availability of pigments shaped palettes. Ultramarine was costlier than gold for centuries; Prussian blue (1704) and synthetic ultramarine (1820s) changed what blues painters could afford. Cluster hues hint at those material choices.',
  },
  {
    title: 'Comparison and attribution',
    body: 'Comparing palettes across a body of work can show how an artist’s color evolved, or flag a work whose palette sits unusually far from the rest. It is evidence to weigh, never proof on its own.',
  },
  {
    title: 'Conservation and condition',
    body: 'Yellowed varnish shifts every cluster toward warm b* values. Measuring palettes before and after cleaning — or between photographs of the same work — quantifies how condition changes appearance.',
  },
]

const METRICS = [
  { term: 'ΔE*ab', definition: 'Distance between two colors in CIELAB. Below ~2 is hard to see, 2–10 is a noticeable shift, above ~10 reads as a different color.' },
  { term: 'L* (lightness)', definition: '0 is black and 100 is white. The tonal chart bands pixels by L* to compare light and shadow.' },
  { term: 'Chroma', definition: 'Distance from neutral gray on the a*/b* plane. Earth tones sit low; saturated blues and vermilions sit high.' },
  { term: 'Share', definition: 'The fraction of sampled pixels assigned to a cluster — area on the canvas, not visual importance.' },
  { term: 'Similarity score', definition: 'Each cluster finds its nearest counterpart in the other palette; distances are weighted by share and averaged both ways, then mapped to 0–100.' },
]

const LIMITATIONS = [
  'k is chosen by you, not discovered. Too small merges distinct colors; too large splits one color into lighting variations.',
  'Results describe a photograph of the painting: lighting, camera profile and varnish all shift the numbers.',
  'Clusters ignore position. A tiny red accent and a large red wall with the same share look the same to the algorithm.',
  'K-means favors compact, similarly sized clusters, so rare but vivid colors can be absorbed into larger neighbors.',
]

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
      <h3 className="font-serif text-3xl font-semibold leading-tight text-balance">{title}</h3>
    </div>
  )
}

export function KmeansExplainer({ artwork }: { artwork: Artwork | null }) {
  const subject = artwork ?? DEMO_ARTWORK

  return (
    <article className="flex flex-col gap-12">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-primary">The method</span>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-balance sm:text-5xl">
            What k-means sees in a painting
          </h2>
        </div>
        <p className="leading-relaxed text-muted-foreground text-pretty">
          K-means clustering is an unsupervised algorithm: given thousands of pixels and a number k, it finds the k
          colors that best summarize them, without being told what any color means. For a painting, those k centroids
          become a palette, and the share of pixels each one claims tells you how much of the canvas it covers.
        </p>
      </header>

      <section aria-labelledby="stepper-heading" className="flex flex-col gap-6 rounded-md border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.18em] text-primary">Interactive</span>
          <h3 id="stepper-heading" className="font-serif text-3xl font-semibold">
            Watch the algorithm run
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            Step through k-means on real pixels{artwork ? ' from your selected Artwork A' : ''}. Each dot is a pixel in
            its true color; numbered circles are the centroids that become the palette.
          </p>
        </div>
        <KmeansStepper key={subject.imageUrl} artwork={subject} />
      </section>

      <section aria-labelledby="algorithm-heading" className="flex flex-col gap-6">
        <SectionHeading eyebrow="Step by step" title="The algorithm" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ALGORITHM_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 border-t border-foreground/80 pt-3">
              <span className="font-serif text-4xl font-semibold italic leading-none text-primary">{index + 1}</span>
              <h4 className="font-medium">{step.title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <p className="shrink-0 font-serif text-2xl italic" aria-label="J equals the sum over clusters i of the sum over pixels x in cluster i of the squared distance between x and centroid mu i">
            J = <span className="text-3xl">Σ</span>
            <sub className="font-sans text-xs not-italic">i</sub>{' '}
            <span className="text-3xl">Σ</span>
            <sub className="font-sans text-xs not-italic">x ∈ C<sub>i</sub></sub> ‖x − μ<sub className="font-sans text-xs">i</sub>‖
            <sup className="font-sans text-xs not-italic">2</sup>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            K-means minimizes J, the total squared distance between each pixel x and the centroid μ of its cluster C.
            Both the assign and update steps can only lower J, which is why the process always settles — though
            possibly in a local minimum, which k-means++ seeding makes much less likely.
          </p>
        </div>
      </section>

      <section aria-labelledby="k-heading" className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <SectionHeading eyebrow="Choosing k" title="How many colors does a painting have?" />
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            There is no single right answer. Each pixel below is replaced by its cluster&apos;s color, so you can see
            exactly what the palette preserves and what it averages away as k grows.
          </p>
        </div>
        <KComparison artwork={subject} />
      </section>

      <section aria-labelledby="art-heading" className="flex flex-col gap-6">
        <SectionHeading eyebrow="Applications" title="Why clustering matters for art" />
        <div className="grid gap-4 sm:grid-cols-2">
          {ART_USES.map((use) => (
            <div key={use.title} className="flex flex-col gap-2 rounded-md border bg-card p-5">
              <h4 className="font-serif text-xl font-semibold">{use.title}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{use.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="metrics-heading" className="flex flex-col gap-4">
          <SectionHeading eyebrow="Glossary" title="Reading the numbers" />
          <dl className="flex flex-col">
            {METRICS.map((metric) => (
              <div key={metric.term} className="grid gap-1 border-b py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-mono text-sm">{metric.term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{metric.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="limits-heading" className="flex flex-col gap-4">
          <SectionHeading eyebrow="Caveats" title="What it can’t tell you" />
          <ul className="flex flex-col">
            {LIMITATIONS.map((limit) => (
              <li key={limit} className="flex gap-3 border-b py-3 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {limit}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
