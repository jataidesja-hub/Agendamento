import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Logs de Atividade' }

export default async function AdminLogsPage() {
  const supabase = createAdminSupabaseClient()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, salon:salon_id (name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Logs de Atividade</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {!logs?.length ? (
          <p className="text-center text-gray-500 py-8">Nenhum log registrado.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">
                    <span className="font-medium text-red-400">{log.action}</span>
                    {log.entity && <span className="text-gray-500"> · {log.entity}</span>}
                    {(log.salon as any)?.name && (
                      <span className="text-gray-500"> · {(log.salon as any).name}</span>
                    )}
                  </p>
                  {log.metadata && (
                    <p className="text-xs text-gray-600 mt-0.5 font-mono truncate">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-600 flex-shrink-0">
                  {format(parseISO(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
