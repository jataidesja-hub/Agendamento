import { createAdminSupabaseClient } from '@/lib/supabase-server'

export const metadata = { title: 'Usuários' }

export default async function AdminUsersPage() {
  const supabase = createAdminSupabaseClient()

  const { data: salons } = await supabase
    .from('salons')
    .select('id, name, slug, is_active, created_at, owner:owner_id (email, id, created_at)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Usuários / Proprietários</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">E-mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Salão</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Cadastrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {salons?.map((salon) => (
              <tr key={salon.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <p className="text-gray-200 text-sm">{(salon.owner as any)?.email || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{salon.name}</p>
                  <p className="text-xs text-gray-500">/{salon.slug}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    salon.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {salon.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-gray-500">
                    {new Date(salon.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!salons?.length && (
          <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado.</p>
        )}
      </div>
    </div>
  )
}
