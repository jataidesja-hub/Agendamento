import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BookingFlow } from '@/components/public/booking-flow'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
  searchParams: { service?: string }
}

export const metadata: Metadata = { title: 'Agendar Horário' }

export default async function BookPage({ params, searchParams }: Props) {
  const supabase = createServerSupabaseClient()

  const { data: salon } = await supabase
    .from('salons')
    .select('*, schedules(*), blocked_dates(*)')
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

  return (
    <BookingFlow
      salon={salon as any}
      services={(services || []) as any}
      preSelectedServiceId={searchParams.service}
    />
  )
}
