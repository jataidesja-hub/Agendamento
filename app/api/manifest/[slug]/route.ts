import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('name, logo_url, primary_color, secondary_color, slug')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!salon) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const themeColor = salon.primary_color || '#d946ef'
  const shortName = salon.name.length > 12 ? salon.name.split(' ')[0] : salon.name

  const icons = salon.logo_url
    ? [
        { src: salon.logo_url, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: salon.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ]
    : [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
      ]

  const manifest = {
    name: salon.name,
    short_name: shortName,
    description: `Agende seu horário em ${salon.name}`,
    start_url: `/${salon.slug}`,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: themeColor,
    lang: 'pt-BR',
    categories: ['lifestyle', 'business'],
    icons,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
