import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SalonsList } from '@/components/public/salons-list'
import { PublicHeader } from '@/components/public/header'

export const metadata = {
  title: 'AgendaBeauty — Agende seu horário',
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient()

  const { data: salons } = await supabase
    .from('salons')
    .select('id, name, slug, description, logo_url, primary_color, secondary_color, categories, city, state, lat, lng, whatsapp')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Agende seu horário
          </h1>
          <p className="text-gray-500 mt-2">
            Encontre salões e profissionais de beleza perto de você.
          </p>
        </div>
        <SalonsList initialSalons={(salons || []) as any} />
      </main>
    </div>
  )
}
