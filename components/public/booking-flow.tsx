'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Check, Clock, Calendar, User,
  MessageCircle, CheckCircle2
} from 'lucide-react'
import { format, addDays, isBefore, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
import { generateTimeSlots, formatCurrency, formatDuration, maskPhone } from '@/lib/utils'
import { buildSalonWhatsAppLink, buildClientBookingMessage } from '@/lib/whatsapp'
import { DAY_NAMES_SHORT } from '@/types'
import type { Salon, Service, Schedule, BlockedDate } from '@/types'

interface SalonWithSchedule extends Salon {
  schedules: Schedule[]
  blocked_dates: BlockedDate[]
}

const clientSchema = z.object({
  client_name: z.string().min(2, 'Nome obrigatório'),
  client_whatsapp: z.string().min(10, 'WhatsApp inválido'),
  notes: z.string().optional(),
})
type ClientData = z.infer<typeof clientSchema>

const STEPS = ['Serviço', 'Data & Hora', 'Seus Dados', 'Confirmado']

export function BookingFlow({
  salon,
  services,
  preSelectedServiceId,
}: {
  salon: SalonWithSchedule
  services: Service[]
  preSelectedServiceId?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const primary = salon.primary_color || '#d946ef'

  const [step, setStep] = useState(preSelectedServiceId ? 1 : 0)
  const [selectedService, setSelectedService] = useState<Service | null>(
    preSelectedServiceId ? services.find((s) => s.id === preSelectedServiceId) || null : null
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ClientData>({
    resolver: zodResolver(clientSchema),
  })
  const whatsappValue = watch('client_whatsapp', '')

  // Gerar próximos 30 dias disponíveis
  const availableDays = useMemo(() => {
    const days: string[] = []
    const blocked = new Set(salon.blocked_dates?.map((d) => d.date) || [])
    const scheduleMap = Object.fromEntries(
      (salon.schedules || []).map((s) => [s.day_of_week, s])
    )

    for (let i = 0; i < 45; i++) {
      const date = addDays(new Date(), i === 0 ? 1 : i)
      const dateStr = format(date, 'yyyy-MM-dd')
      if (blocked.has(dateStr)) continue
      const dow = date.getDay()
      const sched = scheduleMap[dow]
      if (sched?.is_open) days.push(dateStr)
      if (days.length >= 30) break
    }
    return days
  }, [salon])

  // Carregar slots quando data muda
  useEffect(() => {
    if (!selectedDate || !selectedService) return

    async function loadSlots() {
      setLoadingSlots(true)
      setSelectedTime(null)

      const date = parseISO(selectedDate!)
      const dow = date.getDay()
      const sched = salon.schedules?.find((s) => s.day_of_week === dow)
      if (!sched?.is_open || !sched.open_time || !sched.close_time) {
        setAvailableSlots([])
        setLoadingSlots(false)
        return
      }

      const slots = generateTimeSlots(
        sched.open_time,
        sched.close_time,
        sched.slot_interval_minutes,
        sched.break_start,
        sched.break_end
      )

      // Buscar slots já ocupados neste dia
      const { data: existingAppts } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('salon_id', salon.id)
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'confirmed'])

      const booked = existingAppts?.map((a) => a.appointment_time.slice(0, 5)) || []
      setBookedSlots(booked)
      setAvailableSlots(slots)
      setLoadingSlots(false)
    }

    loadSlots()
  }, [selectedDate, selectedService, salon, supabase])

  // Realtime: atualizar slots ao vivo
  useEffect(() => {
    if (!selectedDate) return
    const channel = supabase
      .channel('booking-slots')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `salon_id=eq.${salon.id}`,
      }, (payload) => {
        if (payload.new.appointment_date === selectedDate) {
          setBookedSlots((prev) => [...prev, payload.new.appointment_time.slice(0, 5)])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedDate, salon.id, supabase])

  async function onSubmit(data: ClientData) {
    if (!selectedService || !selectedDate || !selectedTime) return
    setSubmitting(true)

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        salon_id: salon.id,
        service_id: selectedService.id,
        client_name: data.client_name,
        client_whatsapp: data.client_whatsapp.replace(/\D/g, ''),
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        notes: data.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao realizar agendamento. Tente novamente.')
      setSubmitting(false)
      return
    }

    setBookingResult({ ...appointment, client_name: data.client_name, client_whatsapp: data.client_whatsapp })
    setStep(3)
    setSubmitting(false)
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
    else router.push(`/${salon.slug}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          {step < 3 && (
            <button onClick={goBack} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{salon.name}</p>
            <p className="text-xs text-gray-400">Agendamento — {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress bar */}
        {step < 3 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${((step + 1) / 3) * 100}%`, background: primary }}
            />
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* PASSO 0: Escolha o Serviço */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Escolha o serviço</h2>
            {services.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum serviço disponível.</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(1) }}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-brand-400 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">{service.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">{formatDuration(service.duration_minutes)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="font-bold text-lg" style={{ color: primary }}>
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASSO 1: Escolha Data e Hora */}
        {step === 1 && selectedService && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Escolha a data</h2>
              <p className="text-sm text-gray-400 mt-1">Serviço: {selectedService.name}</p>
            </div>

            {/* Grade de datas */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {availableDays.slice(0, 14).map((dateStr) => {
                const date = parseISO(dateStr)
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex-shrink-0 flex flex-col items-center py-2.5 px-3 rounded-2xl border-2 transition-all min-w-[60px] ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-brand-300'
                    }`}
                    style={isSelected ? { background: primary, borderColor: primary } : {}}
                  >
                    <span className="text-xs font-medium">{DAY_NAMES_SHORT[date.getDay()]}</span>
                    <span className="text-lg font-bold leading-none mt-0.5">{format(date, 'd')}</span>
                    <span className="text-xs">{format(date, 'MMM', { locale: ptBR })}</span>
                  </button>
                )
              })}
            </div>

            {/* Grade de horários */}
            {selectedDate && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Horários disponíveis
                </h3>
                {loadingSlots ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Nenhum horário disponível neste dia.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot)
                      const isSelected = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                            isBooked
                              ? 'border-gray-100 bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                              : isSelected
                              ? 'text-white border-transparent'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-brand-300'
                          }`}
                          style={isSelected && !isBooked ? { background: primary } : {}}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: primary }}
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASSO 2: Dados do Cliente */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Seus dados</h2>
              <p className="text-sm text-gray-400 mt-1">Informe seu nome e WhatsApp para confirmar.</p>
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: primary }} />
                <span className="text-gray-500">Serviço:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Data:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedDate && format(parseISO(selectedDate), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">Horário:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Valor:</span>
                <span className="font-bold" style={{ color: primary }}>
                  {selectedService && formatCurrency(selectedService.price)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  {...register('client_name')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
                />
                {errors.client_name && <p className="text-xs text-red-500">{errors.client_name.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsappValue}
                  onChange={(e) => setValue('client_whatsapp', maskPhone(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
                />
                {errors.client_whatsapp && <p className="text-xs text-red-500">{errors.client_whatsapp.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações (opcional)</label>
                <textarea
                  placeholder="Alguma informação adicional?"
                  rows={3}
                  {...register('notes')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: primary }}
              >
                {submitting ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* PASSO 3: Confirmado! */}
        {step === 3 && bookingResult && (
          <div className="space-y-6 animate-slide-up text-center pt-8">
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: primary + '20', color: primary }}
              >
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agendamento Realizado!</h2>
              <p className="text-gray-500 mt-2">
                Seu agendamento está pendente de confirmação.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Salão</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{salon.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Serviço</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Data</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedDate && format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor</span>
                <span className="font-bold" style={{ color: primary }}>
                  {selectedService && formatCurrency(selectedService.price)}
                </span>
              </div>
            </div>

            {salon.whatsapp && selectedService && (
              <a
                href={buildSalonWhatsAppLink(
                  salon,
                  buildClientBookingMessage(
                    { ...bookingResult, appointment_date: selectedDate!, appointment_time: selectedTime! },
                    selectedService,
                    salon
                  )
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Avisar pelo WhatsApp
              </a>
            )}

            <button
              onClick={() => router.push(`/${salon.slug}`)}
              className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:border-gray-300 transition-colors"
            >
              Voltar ao salão
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
