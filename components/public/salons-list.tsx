'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getCurrentPosition, haversineDistance, formatDistance } from '@/lib/geolocation'
import { SALON_CATEGORIES, type SalonCategory } from '@/types'
import type { Salon, SalonWithDistance } from '@/types'

export function SalonsList({ initialSalons }: { initialSalons: Salon[] }) {
  const [salons, setSalons] = useState<SalonWithDistance[]>(initialSalons)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortByDistance, setSortByDistance] = useState(false)
  const [locating, setLocating] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  async function getUserLocation() {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserCoords(coords)
      setSortByDistance(true)
      const withDist = initialSalons.map((s) => ({
        ...s,
        distance:
          s.lat && s.lng
            ? haversineDistance(coords, { lat: Number(s.lat), lng: Number(s.lng) })
            : undefined,
      }))
      setSalons(withDist)
    } catch {
      // silent fail — geolocation denied
    } finally {
      setLocating(false)
    }
  }

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    initialSalons.forEach((s) => s.categories?.forEach((c) => cats.add(c)))
    return Array.from(cats)
  }, [initialSalons])

  const filtered = useMemo(() => {
    let result = salons.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.categories?.some((c) => SALON_CATEGORIES[c as SalonCategory]?.toLowerCase().includes(search.toLowerCase()))

      const matchCat =
        categoryFilter === 'all' || s.categories?.includes(categoryFilter as SalonCategory)

      return matchSearch && matchCat
    })

    if (sortByDistance) {
      result = [...result].sort((a, b) => {
        if (a.distance == null) return 1
        if (b.distance == null) return -1
        return a.distance - b.distance
      })
    }

    return result
  }, [salons, search, categoryFilter, sortByDistance])

  return (
    <div className="space-y-6">
      {/* Busca e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar salão, serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm text-base"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={getUserLocation}
            disabled={locating}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400"
          >
            {locating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <MapPin className="w-4 h-4" />}
            Próximos de mim
          </button>

          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
              categoryFilter === 'all'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Todos
          </button>

          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {SALON_CATEGORIES[cat as SalonCategory] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Nenhum salão encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          filtered.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))
        )}
      </div>
    </div>
  )
}

function SalonCard({ salon }: { salon: SalonWithDistance }) {
  return (
    <Link
      href={`/${salon.slug}`}
      className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all group"
    >
      {/* Logo */}
      <div
        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${salon.primary_color}, ${salon.secondary_color})` }}
      >
        {salon.logo_url ? (
          <Image src={salon.logo_url} alt={salon.name} width={64} height={64} className="object-cover w-full h-full" />
        ) : (
          <span className="text-2xl font-bold text-white">{salon.name[0]}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">
            {salon.name}
          </p>
          {salon.distance != null && (
            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <MapPin className="w-3 h-3" />
              {formatDistance(salon.distance)}
            </span>
          )}
        </div>
        {salon.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{salon.description}</p>
        )}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {salon.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {SALON_CATEGORIES[cat as SalonCategory] || cat}
            </span>
          ))}
        </div>
        {(salon.city || salon.state) && (
          <p className="text-xs text-gray-400 mt-1.5">
            {[salon.city, salon.state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center">
        <span className="text-gray-300 group-hover:text-brand-500 transition-colors text-lg">›</span>
      </div>
    </Link>
  )
}
