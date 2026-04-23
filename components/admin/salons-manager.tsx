'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Check, X, ExternalLink, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SALON_CATEGORIES, type SalonCategory } from '@/types'

const schema = z.object({
  name: z.string().min(2),
  owner_email: z.string().email(),
  owner_password: z.string().min(8),
  categories: z.array(z.string()).min(1),
  whatsapp: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface AdminSalon {
  id: string
  name: string
  slug: string
  is_active: boolean
  categories: string[]
  city?: string
  state?: string
  whatsapp?: string
  created_at: string
  owner?: { email: string }
}

export function AdminSalonsManager({ initialSalons }: { initialSalons: AdminSalon[] }) {
  const [salons, setSalons] = useState(initialSalons)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categories: [] },
  })

  const watchedCats = watch('categories') || []

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/admin/salons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) { toast.error(result.error || 'Erro ao criar salão'); return }
    setSalons((prev) => [result.salon, ...prev])
    toast.success(`Salão criado! Login: ${data.owner_email} / ${data.owner_password}`)
    reset({ categories: [] })
    setShowForm(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/salons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) { toast.error('Erro ao atualizar'); return }
    setSalons((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s))
    toast.success(!current ? 'Salão ativado' : 'Salão desativado')
  }

  const filtered = salons.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar salão ou dono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Salão
        </button>
      </div>

      {/* Formulário de Criação */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Criar Novo Salão</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Nome do Salão *</label>
              <input {...register('name')} className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">E-mail do Dono *</label>
              <input type="email" {...register('owner_email')} className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              {errors.owner_email && <p className="text-xs text-red-400">{errors.owner_email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Senha do Dono *</label>
              <input type="text" {...register('owner_password')} placeholder="Mínimo 8 caracteres" className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              {errors.owner_password && <p className="text-xs text-red-400">{errors.owner_password.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">WhatsApp</label>
              <input {...register('whatsapp')} className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Cidade</label>
              <input {...register('city')} className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Estado</label>
              <input {...register('state')} maxLength={2} className="h-9 px-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-400">Categorias *</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SALON_CATEGORIES).map(([key, label]) => {
                const selected = watchedCats.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setValue('categories', selected
                        ? watchedCats.filter((c) => c !== key)
                        : [...watchedCats, key]
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? 'border-red-500 bg-red-900/30 text-red-400'
                        : 'border-gray-700 text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {errors.categories && <p className="text-xs text-red-400">Selecione ao menos uma categoria</p>}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Criando...' : 'Criar Salão'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-colors">
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salão</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Categorias</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((salon) => (
                <tr key={salon.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{salon.name}</p>
                    <p className="text-xs text-gray-500">/{salon.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-300 text-xs">{salon.owner?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {salon.categories?.slice(0, 2).map((c) => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                          {SALON_CATEGORIES[c as SalonCategory] || c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      salon.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {salon.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/${salon.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => toggleActive(salon.id, salon.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          salon.is_active
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                            : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                        }`}
                      >
                        {salon.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum salão encontrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}
