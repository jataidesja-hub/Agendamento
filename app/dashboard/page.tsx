import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck, Clock, TrendingUp, Users } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!salon) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Nenhum salão encontrado para sua conta.</p>
        <p className="text-sm text-gray-400">Entre em contato com o administrador.</p>
      </div>
    )
  }

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  const [
    { count: totalMonth },
    { count: todayCount },
    { count: pendingCount },
    { data: recentAppointments },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('salon_id', salon.id)
      .gte('appointment_date', monthStart)
      .lte('appointment_date', monthEnd),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('salon_id', salon.id)
      .eq('appointment_date', todayStr),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('salon_id', salon.id)
      .eq('status', 'pending'),
    supabase.from('appointments')
      .select('*, service:services(name, price)')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Hoje', value: todayCount ?? 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Este Mês', value: totalMonth ?? 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Pendentes', value: pendingCount ?? 0, icon: Users, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Agendamentos', value: (totalMonth ?? 0), icon: CalendarCheck, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Olá! Bem-vindo ao painel 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agendamentos Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agendamentos Recentes</CardTitle>
            <Link href="/dashboard/appointments" className="text-sm text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!recentAppointments?.length ? (
            <p className="text-center text-gray-400 py-8">Nenhum agendamento ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{appt.client_name}</p>
                    <p className="text-xs text-gray-500">{(appt.service as any)?.name} · {appt.appointment_date} {appt.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${APPOINTMENT_STATUS_COLORS[appt.status as keyof typeof APPOINTMENT_STATUS_COLORS]}`}>
                    {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atalhos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/profile', label: 'Editar Perfil', emoji: '🏠' },
          { href: '/dashboard/services', label: 'Gerenciar Serviços', emoji: '✂️' },
          { href: '/dashboard/schedule', label: 'Configurar Agenda', emoji: '📅' },
          { href: '/dashboard/appointments', label: 'Ver Agendamentos', emoji: '📋' },
        ].map(({ href, label, emoji }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-300 hover:shadow-sm transition-all text-center"
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
