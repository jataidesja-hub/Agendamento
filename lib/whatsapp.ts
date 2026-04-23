import { Appointment, Service, Salon } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy (EEEE)", { locale: ptBR })
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export function buildConfirmationMessage(
  appointment: Appointment,
  service: Service,
  salon: Salon
): string {
  const date = formatDate(appointment.appointment_date)
  const time = formatTime(appointment.appointment_time)
  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(service.price)

  return (
    `✅ *Agendamento Confirmado!*\n\n` +
    `Olá, *${appointment.client_name}*! Seu agendamento foi confirmado.\n\n` +
    `📍 *${salon.name}*\n` +
    `✂️ Serviço: ${service.name}\n` +
    `📅 Data: ${date}\n` +
    `🕐 Horário: ${time}\n` +
    `💰 Valor: ${price}\n\n` +
    `Em caso de dúvidas ou cancelamento, entre em contato conosco.\n` +
    `Até logo! 👋`
  )
}

export function buildClientBookingMessage(
  appointment: Appointment,
  service: Service,
  salon: Salon
): string {
  const date = formatDate(appointment.appointment_date)
  const time = formatTime(appointment.appointment_time)
  const price = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(service.price)

  return (
    `Olá! Gostaria de confirmar meu agendamento:\n\n` +
    `📍 *${salon.name}*\n` +
    `✂️ Serviço: ${service.name}\n` +
    `📅 Data: ${date}\n` +
    `🕐 Horário: ${time}\n` +
    `💰 Valor: ${price}\n\n` +
    `Meu nome: ${appointment.client_name}`
  )
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = formatPhone(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function buildSalonWhatsAppLink(salon: Salon, message?: string): string {
  if (!salon.whatsapp) return '#'
  const phone = formatPhone(salon.whatsapp)
  if (!message) return `https://wa.me/${phone}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
