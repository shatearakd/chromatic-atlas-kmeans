import { type NextRequest, NextResponse } from 'next/server'
import { IMAGE_HOST } from '@/lib/artworks'

// Canvas pixel reads require same-origin (or CORS-enabled) images, and the museum CDN
// does not send CORS headers, so k-means sampling goes through this allow-listed proxy.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (target.protocol !== 'https:' || target.hostname !== IMAGE_HOST || !/_web\.jpe?g$/i.test(target.pathname)) {
    return NextResponse.json({ error: 'Image host not allowed' }, { status: 400 })
  }

  const upstream = await fetch(target.toString(), { next: { revalidate: 604800 } })
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Image unavailable' }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  })
}
