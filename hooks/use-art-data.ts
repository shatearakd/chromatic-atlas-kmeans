'use client'

import useSWR from 'swr'
import type { ArtworkSearchResponse } from '@/lib/artworks'
import type { PaletteColor } from '@/lib/color'
import { extractPalette } from '@/lib/kmeans'

export async function jsonFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const body = await response.json()
  if (!response.ok) throw new Error(body?.error ?? 'Request failed')
  return body as T
}

export function useArtworkSearch(query: string) {
  const params = new URLSearchParams({ limit: '12' })
  if (query) params.set('q', query)
  return useSWR<ArtworkSearchResponse>(`/api/artworks?${params.toString()}`, jsonFetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
}

export function usePalette(imageUrl: string | undefined, k: number) {
  return useSWR<PaletteColor[], Error, [string, string, number] | null>(
    imageUrl ? ['palette', imageUrl, k] : null,
    ([, url, clusters]) => extractPalette(url, clusters),
    { revalidateOnFocus: false, revalidateIfStale: false },
  )
}
