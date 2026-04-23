import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ScheduleManager } from '@/components/dashboard/schedule-manager'

export const metadata = { title: 'Agenda' }

export default async function SchedulePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!salon) return (
    <div className="text-center py-16 text-gray-500">Configure o perfil do salão primeiro.</div>
  )

  const [{ data: schedules }, { data: blockedDates }] = await Promise.all([
    supabase.from('schedules').select('*').eq('salon_id', salon.id).order('day_of_week'),
    supabase.from('blocked_dates').select('*').eq('salon_id', salon.id).order('date'),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuração da Agenda</h1>
        <p className="text-gray-500 mt-1">Defina seus horários de atendimento e datas bloqueadas.</p>
      </div>
      <ScheduleManager
        salonId={salon.id}
        initialSchedules={schedules || []}
        initialBlockedDates={blockedDates || []}
      />
    </div>
  )
}
