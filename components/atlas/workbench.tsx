'use client'

import { useState } from 'react'
import { KmeansExplainer } from '@/components/atlas/about/kmeans-explainer'
import { CompareView } from '@/components/atlas/compare-view'
import { PaletteSearchView } from '@/components/atlas/palette-search-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Artwork } from '@/lib/artworks'

type Tab = 'compare' | 'palette' | 'about'

export function Workbench() {
  const [tab, setTab] = useState<Tab>('compare')
  const [artworkA, setArtworkA] = useState<Artwork | null>(null)
  const [artworkB, setArtworkB] = useState<Artwork | null>(null)
  const [k, setK] = useState(6)

  const sendToCompare = (slot: 'A' | 'B', artwork: Artwork) => {
    if (slot === 'A') setArtworkA(artwork)
    else setArtworkB(artwork)
    setTab('compare')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-6">
      <TabsList variant="line" className="h-auto max-w-full justify-start gap-6 overflow-x-auto border-b pb-0">
        <TabsTrigger value="compare" className="px-0 pb-2 text-base">
          Compare two works
        </TabsTrigger>
        <TabsTrigger value="palette" className="px-0 pb-2 text-base">
          Search by palette
        </TabsTrigger>
        <TabsTrigger value="about" className="px-0 pb-2 text-base">
          How k-means works
        </TabsTrigger>
      </TabsList>
      <TabsContent value="compare">
        <CompareView
          artworkA={artworkA}
          artworkB={artworkB}
          k={k}
          onKChange={setK}
          onSelectA={setArtworkA}
          onSelectB={setArtworkB}
        />
      </TabsContent>
      <TabsContent value="palette" keepMounted>
        <PaletteSearchView onCompare={sendToCompare} />
      </TabsContent>
      <TabsContent value="about">
        <KmeansExplainer artwork={artworkA} />
      </TabsContent>
    </Tabs>
  )
}
