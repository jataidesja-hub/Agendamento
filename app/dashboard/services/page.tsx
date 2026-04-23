import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ServicesManager } from '@/components/dashboard/services-manager'

export const metadata = { title: 'Serviços' }

export default async function ServicesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!salon) return (
    <div className="text-center py-16 text-gray-500">
      Configure o perfil do salão primeiro.
    </div>
  )

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .order('order_index', { ascending: true })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Serviços</h1>
        <p className="text-gray-500 mt-1">Gerencie os serviços que você oferece.</p>
      </div>
      <ServicesManager salonId={salon.id} initialServices={services || []} />
    </div>
  )
}
