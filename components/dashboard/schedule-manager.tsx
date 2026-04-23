'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Save } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
import { DAY_NAMES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Schedule, BlockedDate } from '@/types'

const INTERVAL_OPTIONS = [
  { value: '15', label: '15 minutos' },
  { value: '20', label: '20 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
]

export function ScheduleManager({
  salonId,
  initialSchedules,
  initialBlockedDates,
}: {
  salonId: string
  initialSchedules: Schedule[]
  initialBlockedDates: BlockedDate[]
}) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates)
  const [saving, setSaving] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newDateReason, setNewDateReason] = useState('')

  function updateSchedule(id: string, field: keyof Schedule, value: unknown) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  async function saveSchedules() {
    setSaving(true)
    try {
      await Promise.all(
        schedules.map((s) =>
          supabase.from('schedules').update({
            is_open: s.is_open,
            open_time: s.open_time,
            close_time: s.close_time,
            break_start: s.break_start,
            break_end: s.break_end,
            slot_interval_minutes: s.slot_interval_minutes,
          }).eq('id', s.id)
        )
      )
      toast.success('Agenda salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar agenda')
    } finally {
      setSaving(false)
    }
  }

  async function addBlockedDate() {
    if (!newDate) { toast.error('Selecione uma data'); return }
    const { data, error } = await supabase
      .from('blocked_dates')
      .insert({ salon_id: salonId, date: newDate, reason: newDateReason || null })
      .select()
      .single()

    if (error) { toast.error(error.message); return }
    setBlockedDates((prev) => [...prev, data])
    setNewDate('')
    setNewDateReason('')
    toast.success('Data bloqueada adicionada!')
  }

  async function removeBlockedDate(id: string) {
    const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setBlockedDates((prev) => prev.filter((d) => d.id !== id))
    toast.success('Data desbloqueada')
  }

  return (
    <div className="space-y-6">
      {/* Horários por dia */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-2xl border transition-colors ${
                schedule.is_open
                  ? 'border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-900/10'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
              }`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-24 flex-shrink-0">
                  <Switch
                    checked={schedule.is_open}
                    onCheckedChange={(v) => updateSchedule(schedule.id, 'is_open', v)}
                    label={DAY_NAMES[schedule.day_of_week]}
                  />
                </div>

                {schedule.is_open && (
                  <div className="flex flex-wrap gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Abre</label>
                      <input
                        type="time"
                        value={schedule.open_time || '09:00'}
                        onChange={(e) => updateSchedule(schedule.id, 'open_time', e.target.value)}
                        className="h-8 px-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Fecha</label>
                      <input
                        type="time"
                        value={schedule.close_time || '18:00'}
                        onChange={(e) => updateSchedule(schedule.id, 'close_time', e.target.value)}
                        className="h-8 px-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Pausa</label>
                      <input
                        type="time"
                        value={schedule.break_start || ''}
                        onChange={(e) => updateSchedule(schedule.id, 'break_start', e.target.value || null)}
                        className="h-8 px-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-400">até</span>
                      <input
                        type="time"
                        value={schedule.break_end || ''}
                        onChange={(e) => updateSchedule(schedule.id, 'break_end', e.target.value || null)}
                        className="h-8 px-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Intervalo</label>
                      <Select
                        value={String(schedule.slot_interval_minutes)}
                        onValueChange={(v) => updateSchedule(schedule.id, 'slot_interval_minutes', Number(v))}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERVAL_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button onClick={saveSchedules} loading={saving}>
              <Save className="w-4 h-4" />
              Salvar Horários
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Datas Bloqueadas */}
      <Card>
        <CardHeader>
          <CardTitle>Datas Bloqueadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              value={newDateReason}
              onChange={(e) => setNewDateReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-40"
            />
            <Button onClick={addBlockedDate} variant="outline">
              <Plus className="w-4 h-4" />
              Bloquear Data
            </Button>
          </div>

          {blockedDates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma data bloqueada.</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      {format(parseISO(bd.date), "dd 'de' MMMM 'de' yyyy (EEEE)", { locale: ptBR })}
                    </p>
                    {bd.reason && <p className="text-xs text-red-500">{bd.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeBlockedDate(bd.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
