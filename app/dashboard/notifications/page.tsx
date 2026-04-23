import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NotificationsManager } from '@/components/dashboard/notifications-manager'

export const metadata = { title: 'Notificações' }

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('id, whatsapp')
    .eq('owner_id', user.id)
    .single()

  if (!salon) return (
    <div className="text-center py-16 text-gray-500">Configure o perfil do salão primeiro.</div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notificações</h1>
        <p className="text-gray-500 mt-1">Configure alertas e mensagens automáticas.</p>
      </div>
      <NotificationsManager salonId={salon.id} />
    </div>
  )
}
