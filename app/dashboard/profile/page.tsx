import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ProfileForm } from '@/components/dashboard/profile-form'

export const metadata = { title: 'Perfil do Salão' }

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: salon } = await supabase
    .from('salons')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perfil do Salão</h1>
        <p className="text-gray-500 mt-1">Configure as informações públicas do seu estabelecimento.</p>
      </div>
      <ProfileForm salon={salon} userId={user.id} />
    </div>
  )
}
