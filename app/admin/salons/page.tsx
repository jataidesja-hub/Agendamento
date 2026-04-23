import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { AdminSalonsManager } from '@/components/admin/salons-manager'

export const metadata = { title: 'Gerenciar Salões' }

export default async function AdminSalonsPage() {
  const supabase = createAdminSupabaseClient()

  const { data: salons } = await supabase
    .from('salons')
    .select(`
      id, name, slug, is_active, categories, city, state, whatsapp, created_at,
      owner:owner_id (email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Salões</h1>
          <p className="text-gray-400 text-sm mt-1">{salons?.length || 0} salões cadastrados</p>
        </div>
      </div>
      <AdminSalonsManager initialSalons={(salons || []) as any} />
    </div>
  )
}
