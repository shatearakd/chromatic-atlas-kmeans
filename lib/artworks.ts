export interface Artwork {
  id: number
  title: string
  artist: string
  date: string
  culture: string
  technique: string
  imageUrl: string
  width: number
  height: number
  pageUrl: string
}

export interface ArtworkSearchResponse {
  total: number
  artworks: Artwork[]
}

export const IMAGE_HOST = 'openaccess-cdn.clevelandart.org'
export const CLASSICAL_CUTOFF_YEAR = 1900
