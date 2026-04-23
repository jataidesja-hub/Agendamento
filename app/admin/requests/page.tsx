import { ClipboardList } from 'lucide-react'
import { RequestsManager } from '@/components/admin/requests-manager'

export const metadata = {
  title: 'Solicitações — Admin AgendaBeauty',
}

export default function RequestsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Solicitações de Acesso</h1>
          <p className="text-sm text-gray-500">Gerencie pedidos de novos salões</p>
        </div>
      </div>

      <RequestsManager />
    </div>
  )
}
