'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Phone, Mail, Building2, User, RefreshCw, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type RequestStatus = 'pending' | 'contacted' | 'approved' | 'rejected'

interface SalonRequest {
  id: string
  full_name: string
  company_name: string
  email: string
  whatsapp: string
  status: RequestStatus
  notes: string | null
  created_at: string
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendente',
  contacted: 'Contatado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  pending: 'contacted',
  contacted: 'approved',
}

const NEXT_STATUS_LABEL: Partial<Record<RequestStatus, string>> = {
  pending: 'Marcar como Contatado',
  contacted: 'Marcar como Aprovado',
}

export function RequestsManager() {
  const [requests, setRequests] = useState<SalonRequest[]>([])
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const url = filter === 'all' ? '/api/admin/requests' : `/api/admin/requests?status=${filter}`
    const res = await fetch(url)
    if (!res.ok) { toast.error('Erro ao carregar solicitações'); setLoading(false); return }
    setRequests(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: RequestStatus) {
    setUpdating(id)
    const res = await fetch('/api/admin/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) toast.error('Erro ao atualizar status')
    else {
      toast.success('Status atualizado')
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
    setUpdating(null)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'contacted', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === s
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-red-400'
            )}
          >
            {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
            {s === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhuma solicitação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', STATUS_STYLES[req.status])}>
                      {STATUS_LABELS[req.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {req.full_name}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {req.company_name}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <a
                      href={`mailto:${req.email}`}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {req.email}
                    </a>
                    <a
                      href={`https://wa.me/${req.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      +{req.whatsapp.slice(0, 2)} ({req.whatsapp.slice(2, 4)}) {req.whatsapp.slice(4, 9)}-{req.whatsapp.slice(9)}
                    </a>
                    <a
                      href={`tel:+${req.whatsapp}`}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Ligar
                    </a>
                  </div>
                </div>

                {/* Ações */}
                {req.status !== 'approved' && req.status !== 'rejected' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(req.id, NEXT_STATUS[req.status]!)}
                      disabled={updating === req.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50"
                    >
                      {NEXT_STATUS_LABEL[req.status]}
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, 'rejected')}
                      disabled={updating === req.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
