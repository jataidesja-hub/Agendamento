import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { Store, CalendarCheck, Users, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Dashboard Admin' }

export default async function AdminDashboard() {
  const supabase = createAdminSupabaseClient()

  const [
    { count: totalSalons },
    { count: activeSalons },
    { count: totalAppointments },
    { count: totalUsers },
    { data: topSalons },
  ] = await Promise.all([
    supabase.from('salons').select('*', { count: 'exact', head: true }),
    supabase.from('salons').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('salons').select('owner_id', { count: 'exact', head: true }),
    supabase.from('salons')
      .select('id, name, slug, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const stats = [
    { label: 'Total de Salões', value: totalSalons ?? 0, icon: Store, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: 'Salões Ativos', value: activeSalons ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: 'Total Agendamentos', value: totalAppointments ?? 0, icon: CalendarCheck, color: 'text-brand-400', bg: 'bg-brand-900/20' },
    { label: 'Proprietários', value: totalUsers ?? 0, icon: Users, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Salões Recentes</h2>
          <a href="/admin/salons" className="text-sm text-red-400 hover:underline">Ver todos</a>
        </div>
        <div className="divide-y divide-gray-800">
          {topSalons?.map((salon) => (
            <div key={salon.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white text-sm">{salon.name}</p>
                <p className="text-xs text-gray-500">/{salon.slug}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                salon.is_active
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {salon.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
