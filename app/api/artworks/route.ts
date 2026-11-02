import { type NextRequest, NextResponse } from 'next/server'
import { type Artwork, type ArtworkSearchResponse, CLASSICAL_CUTOFF_YEAR, IMAGE_HOST } from '@/lib/artworks'

const API_BASE = 'https://openaccess-api.clevelandart.org/api/artworks/'
const MAX_LIMIT = 48

interface ClevelandArtwork {
  id: number
  title?: string
  creation_date?: string
  culture?: string[]
  technique?: string
  url?: string
  creators?: { description?: string }[]
  images?: { web?: { url?: string; width?: string; height?: string } }
}

interface ClevelandResponse {
  info?: { total?: number }
  data?: ClevelandArtwork[]
}

function buildUrl(query: string, limit: number, skip: number) {
  const params = new URLSearchParams({
    type: 'Painting',
    has_image: '1',
    cc0: '1',
    created_before: String(CLASSICAL_CUTOFF_YEAR),
    limit: String(limit),
    skip: String(skip),
    fields: 'id,title,creation_date,creators,images,url,culture,technique',
  })
  if (query) params.set('q', query)
  return `${API_BASE}?${params.toString()}`
}

async function fetchCleveland(url: string, cache: boolean): Promise<ClevelandResponse> {
  const response = await fetch(url, cache ? { next: { revalidate: 86400 } } : { cache: 'no-store' })
  if (!response.ok) throw new Error(`Cleveland Museum API responded with ${response.status}`)
  return response.json()
}

function normalize(item: ClevelandArtwork): Artwork | null {
  const web = item.images?.web
  if (!web?.url) return null
  try {
    if (new URL(web.url).hostname !== IMAGE_HOST) return null
  } catch {
    return null
  }
  return {
    id: item.id,
    title: item.title ?? 'Untitled',
    artist: item.creators?.[0]?.description ?? 'Unknown artist',
    date: item.creation_date ?? 'Undated',
    culture: item.culture?.[0] ?? '',
    technique: item.technique ?? '',
    imageUrl: web.url,
    width: Number(web.width) || 0,
    height: Number(web.height) || 0,
    pageUrl: item.url ?? `https://clevelandart.org/art/collection/search`,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = (searchParams.get('q') ?? '').trim().slice(0, 120)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit')) || 12))
  const random = searchParams.get('random') === '1'

  try {
    let skip = Math.max(0, Number(searchParams.get('skip')) || 0)

    if (random) {
      const probe = await fetchCleveland(buildUrl(query, 1, 0), true)
      const total = probe.info?.total ?? 0
      skip = total > limit ? Math.floor(Math.random() * (total - limit)) : 0
    }

    const result = await fetchCleveland(buildUrl(query, limit, skip), !random)
    const artworks = (result.data ?? []).map(normalize).filter((a): a is Artwork => a !== null)
    const body: ArtworkSearchResponse = { total: result.info?.total ?? artworks.length, artworks }
    return NextResponse.json(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach the museum API'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
