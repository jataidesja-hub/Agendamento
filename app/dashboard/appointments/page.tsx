import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AppointmentsManager } from '@/components/dashboard/appointments-manager'

export const metadata = { title: 'Agendamentos' }

export default async function AppointmentsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('id, name, whatsapp, primary_color')
    .eq('owner_id', user.id)
    .single()

  if (!salon) return (
    <div className="text-center py-16 text-gray-500">Configure o perfil do salão primeiro.</div>
  )

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, service:services(name, price, duration_minutes)')
    .eq('salon_id', salon.id)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agendamentos</h1>
        <p className="text-gray-500 mt-1">Gerencie todos os agendamentos do seu salão.</p>
      </div>
      <AppointmentsManager
        salon={salon as any}
        initialAppointments={(appointments || []) as any}
      />
    </div>
  )
}
