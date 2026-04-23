'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, MessageCircle, Phone, Search, Filter, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { buildWhatsAppLink, buildConfirmationMessage } from '@/lib/whatsapp'
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Appointment, Service, Salon } from '@/types'

type AppointmentWithService = Appointment & { service: Service }

function formatDateLabel(dateStr: string) {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "dd 'de' MMMM", { locale: ptBR })
}

export function AppointmentsManager({
  salon,
  initialAppointments,
}: {
  salon: Salon
  initialAppointments: AppointmentWithService[]
}) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<AppointmentWithService[]>(initialAppointments)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Realtime: subscribe to new appointments
  useEffect(() => {
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salon.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('appointments')
              .select('*, service:services(name, price, duration_minutes)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setAppointments((prev) => [data as AppointmentWithService, ...prev])
              toast.info(`Novo agendamento: ${payload.new.client_name}`, {
                description: `${payload.new.appointment_date} às ${String(payload.new.appointment_time).slice(0, 5)}`,
              })
            }
          }
          if (payload.eventType === 'UPDATE') {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a
              )
            )
          }
          if (payload.eventType === 'DELETE') {
            setAppointments((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [salon.id, supabase])

  async function updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) { toast.error(error.message); return }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
    toast.success(`Agendamento ${APPOINTMENT_STATUS_LABELS[status].toLowerCase()}`)
  }

  function sendWhatsApp(appt: AppointmentWithService) {
    if (!salon.whatsapp) { toast.error('Configure o WhatsApp do salão primeiro'); return }
    const message = buildConfirmationMessage(appt, appt.service, salon)
    const link = buildWhatsAppLink(appt.client_whatsapp, message)
    window.open(link, '_blank')
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    const matchSearch =
      !search ||
      a.client_name.toLowerCase().includes(search.toLowerCase()) ||
      a.client_whatsapp.includes(search) ||
      a.service?.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Agrupar por data
  const grouped = filtered.reduce<Record<string, AppointmentWithService[]>>((acc, appt) => {
    const date = appt.appointment_date
    if (!acc[date]) acc[date] = []
    acc[date].push(appt)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const pendingCount = appointments.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente, serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({appointments.length})</SelectItem>
            <SelectItem value="pending">Pendentes ({appointments.filter(a=>a.status==='pending').length})</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
            {pendingCount} agendamento(s) pendente(s) aguardando confirmação
          </span>
        </div>
      )}

      {/* Lista agrupada por data */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Nenhum agendamento encontrado</p>
          <p className="text-sm mt-1">Tente outro filtro ou aguarde novos agendamentos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {formatDateLabel(date)} — {format(parseISO(date), 'dd/MM/yyyy')}
              </h3>
              <div className="space-y-3">
                {grouped[date]
                  .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                  .map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onConfirm={() => updateStatus(appt.id, 'confirmed')}
                      onComplete={() => updateStatus(appt.id, 'completed')}
                      onCancel={() => updateStatus(appt.id, 'cancelled')}
                      onWhatsApp={() => sendWhatsApp(appt)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AppointmentCard({
  appt,
  onConfirm,
  onComplete,
  onCancel,
  onWhatsApp,
}: {
  appt: AppointmentWithService
  onConfirm: () => void
  onComplete: () => void
  onCancel: () => void
  onWhatsApp: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handle(fn: () => void) {
    setLoading(true)
    await fn()
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          {/* Horário */}
          <div className="flex-shrink-0 text-center w-14">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
              {appt.appointment_time.slice(0, 5)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{appt.service?.duration_minutes}min</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{appt.client_name}</p>
                <p className="text-sm text-gray-500">{appt.service?.name}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${APPOINTMENT_STATUS_COLORS[appt.status]}`}>
                {APPOINTMENT_STATUS_LABELS[appt.status]}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <a
                href={`tel:${appt.client_whatsapp}`}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Phone className="w-3 h-3" />
                {appt.client_whatsapp}
              </a>
              {appt.service?.price > 0 && (
                <span className="text-xs font-semibold text-brand-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appt.service.price)}
                </span>
              )}
            </div>

            {appt.notes && (
              <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{appt.notes}&rdquo;</p>
            )}

            {/* Ações */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={onWhatsApp}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </button>

              {appt.status === 'pending' && (
                <>
                  <button
                    onClick={() => handle(onConfirm)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => handle(onCancel)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </>
              )}

              {appt.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => handle(onComplete)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Concluir
                  </button>
                  <button
                    onClick={() => handle(onCancel)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
