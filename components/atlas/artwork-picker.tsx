'use client'

import { Search } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtworkSearch } from '@/hooks/use-art-data'
import type { Artwork } from '@/lib/artworks'

const SUGGESTIONS = ['Monet', 'Rembrandt', 'Turner', 'landscape', 'portrait', 'still life']

interface ArtworkPickerProps {
  slotLabel: string
  onSelect: (artwork: Artwork) => void
}

export function ArtworkPicker({ slotLabel, onSelect }: ArtworkPickerProps) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const { data, error, isLoading, isValidating } = useArtworkSearch(query)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setQuery(draft.trim())
  }

  const runSuggestion = (value: string) => {
    setDraft(value)
    setQuery(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex gap-2" role="search">
        <label htmlFor={`search-${slotLabel}`} className="sr-only">
          Search public-domain paintings for {slotLabel}
        </label>
        <Input
          id={`search-${slotLabel}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Artist, title or subject"
          className="bg-card"
        />
        <Button type="submit" aria-label="Search">
          <Search aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => runSuggestion(s)}
            className="rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : isLoading && !data ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      ) : data && data.artworks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No public-domain paintings found for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul
          className={`grid grid-cols-3 gap-2 transition-opacity ${isValidating ? 'opacity-60' : ''}`}
          aria-label="Search results"
        >
          {data?.artworks.map((artwork) => (
            <li key={artwork.id}>
              <button
                type="button"
                onClick={() => onSelect(artwork)}
                className="group flex w-full flex-col gap-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="block aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork.imageUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="line-clamp-1 text-xs font-medium">{artwork.title}</span>
                <span className="line-clamp-1 text-[11px] text-muted-foreground">{artwork.date}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <p className="text-[11px] text-muted-foreground">
          {data.total.toLocaleString()} CC0 paintings created before 1900
          {query ? ` matching “${query}”` : ''}
        </p>
      )}
    </div>
  )
}
