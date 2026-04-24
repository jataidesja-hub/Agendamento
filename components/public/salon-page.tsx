'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Instagram, MessageCircle, Clock, ArrowLeft, Calendar } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { buildSalonWhatsAppLink } from '@/lib/whatsapp'
import { SALON_CATEGORIES, type SalonCategory } from '@/types'
import type { Salon, Service } from '@/types'
import { PwaInstallPrompt } from '@/components/public/pwa-install-prompt'

export function SalonPublicPage({ salon, services }: { salon: Salon; services: Service[] }) {
  const primary = salon.primary_color || '#d946ef'
  const secondary = salon.secondary_color || '#a21caf'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header dinâmico com cor do salão */}
      <div
        className="relative"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
              {salon.logo_url ? (
                <Image src={salon.logo_url} alt={salon.name} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <span className="text-3xl font-bold text-white">{salon.name[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{salon.name}</h1>
              {salon.description && (
                <p className="text-white/80 text-sm mt-1">{salon.description}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {salon.categories?.map((cat) => (
                  <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {SALON_CATEGORIES[cat as SalonCategory] || cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Botão Agendar */}
        <Link
          href={`/${salon.slug}/book`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          <Calendar className="w-5 h-5" />
          Agendar Horário
        </Link>

        {/* Contato */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Contato</h2>
          <div className="space-y-2">
            {salon.whatsapp && (
              <a
                href={buildSalonWhatsAppLink(salon)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">WhatsApp: {salon.whatsapp}</span>
              </a>
            )}
            {salon.phone && (
              <a
                href={`tel:${salon.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{salon.phone}</span>
              </a>
            )}
            {salon.instagram && (
              <a
                href={`https://instagram.com/${salon.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 hover:bg-pink-100 transition-colors"
              >
                <Instagram className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{salon.instagram}</span>
              </a>
            )}
          </div>
        </div>

        {/* Endereço + Mapa */}
        {salon.address && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Localização</h2>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{salon.address}</p>
                {(salon.city || salon.state) && (
                  <p className="text-xs text-gray-400">{[salon.city, salon.state].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
            {salon.lat && salon.lng && (
              <div className="rounded-xl overflow-hidden h-40 bg-gray-100 dark:bg-gray-800">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${salon.lat},${salon.lng}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Serviços */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Serviços</h2>
          {services.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum serviço cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-gray-400 truncate">{service.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{formatDuration(service.duration_minutes)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="font-bold text-sm" style={{ color: primary }}>
                      {formatCurrency(service.price)}
                    </span>
                    <Link
                      href={`/${salon.slug}/book?service=${service.id}`}
                      className="text-xs px-3 py-1 rounded-full text-white font-medium"
                      style={{ background: primary }}
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PWA install prompt — Android nativo / iOS instruções */}
      <PwaInstallPrompt salon={salon} />
    </div>
  )
}
