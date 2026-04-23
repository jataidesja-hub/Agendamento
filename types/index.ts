export type SalonCategory =
  | 'barbearia'
  | 'salao-feminino'
  | 'manicure'
  | 'sobrancelha'
  | 'maquiagem'
  | 'estetica'
  | 'depilacao'
  | 'cabelereiro'
  | 'podologia'

export const SALON_CATEGORIES: Record<SalonCategory, string> = {
  'barbearia': 'Barbearia',
  'salao-feminino': 'Salão Feminino',
  'manicure': 'Manicure / Pedicure',
  'sobrancelha': 'Design de Sobrancelha',
  'maquiagem': 'Maquiagem',
  'estetica': 'Estética',
  'depilacao': 'Depilação',
  'cabelereiro': 'Cabeleireiro',
  'podologia': 'Podologia',
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface Salon {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  categories: SalonCategory[]
  whatsapp: string | null
  instagram: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  lat: number | null
  lng: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  salon_id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  salon_id: string
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
  break_start: string | null
  break_end: string | null
  slot_interval_minutes: number
  created_at: string
  updated_at: string
}

export interface BlockedDate {
  id: string
  salon_id: string
  date: string
  reason: string | null
  created_at: string
}

export interface Appointment {
  id: string
  salon_id: string
  service_id: string
  client_name: string
  client_whatsapp: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  service?: Service
}

export interface PushSubscription {
  id: string
  salon_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface SalonWithDistance extends Salon {
  distance?: number
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
