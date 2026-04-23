import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SalonPublicPage } from '@/components/public/salon-page'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('name, description, logo_url')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!salon) return { title: 'Salão não encontrado' }

  return {
    title: salon.name,
    description: salon.description || `Agende seu horário em ${salon.name}`,
    openGraph: {
      title: salon.name,
      description: salon.description || '',
      images: salon.logo_url ? [salon.logo_url] : [],
    },
  }
}

export default async function SalonPage({ params }: Props) {
  const supabase = createServerSupabaseClient()

  const { data: salon } = await supabase
    .from('salons')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!salon) notFound()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  return <SalonPublicPage salon={salon as any} services={(services || []) as any} />
}
