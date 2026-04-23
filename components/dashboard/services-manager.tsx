'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { Plus, GripVertical, Pencil, Trash2, Check, X as XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  duration_minutes: z.coerce.number().min(5, 'Mínimo 5 minutos'),
})
type FormData = z.infer<typeof schema>

export function ServicesManager({ salonId, initialServices }: { salonId: string; initialServices: Service[] }) {
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, duration_minutes: 60 },
  })

  async function onSubmit(data: FormData) {
    if (editingId) {
      const { data: updated, error } = await supabase
        .from('services')
        .update(data)
        .eq('id', editingId)
        .select()
        .single()

      if (error) { toast.error(error.message); return }
      setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
      toast.success('Serviço atualizado!')
      setEditingId(null)
    } else {
      const order_index = services.length
      const { data: created, error } = await supabase
        .from('services')
        .insert({ ...data, salon_id: salonId, order_index })
        .select()
        .single()

      if (error) { toast.error(error.message); return }
      setServices((prev) => [...prev, created])
      toast.success('Serviço adicionado!')
    }
    reset({ price: 0, duration_minutes: 60 })
    setShowForm(false)
  }

  function startEdit(service: Service) {
    setEditingId(service.id)
    setShowForm(true)
    setValue('name', service.name)
    setValue('description', service.description || '')
    setValue('price', service.price)
    setValue('duration_minutes', service.duration_minutes)
  }

  async function toggleActive(service: Service) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id)

    if (error) { toast.error(error.message); return }
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s))
    )
  }

  async function deleteService(id: string) {
    if (!confirm('Remover este serviço?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setServices((prev) => prev.filter((s) => s.id !== id))
    toast.success('Serviço removido')
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const items = Array.from(services)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    const reordered = items.map((s, i) => ({ ...s, order_index: i }))
    setServices(reordered)

    await Promise.all(
      reordered.map((s) =>
        supabase.from('services').update({ order_index: s.order_index }).eq('id', s.id)
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Formulário de Adição/Edição */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Serviço"
                  placeholder="Ex: Corte Masculino"
                  required
                  {...register('name')}
                  error={errors.name?.message}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Preço (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    required
                    {...register('price')}
                    error={errors.price?.message}
                  />
                  <Input
                    label="Duração (min)"
                    type="number"
                    min="5"
                    placeholder="60"
                    required
                    {...register('duration_minutes')}
                    error={errors.duration_minutes?.message}
                  />
                </div>
              </div>
              <Textarea
                label="Descrição (opcional)"
                placeholder="Descreva o serviço..."
                {...register('description')}
              />
              <div className="flex gap-3">
                <Button type="submit" loading={isSubmitting}>
                  <Check className="w-4 h-4" />
                  {editingId ? 'Salvar' : 'Adicionar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    reset({ price: 0, duration_minutes: 60 })
                  }}
                >
                  <XIcon className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista com Drag */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="services">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {services.map((service, index) => (
                <Draggable key={service.id} draggableId={service.id} index={index}>
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-gray-900 transition-shadow ${
                        snapshot.isDragging
                          ? 'shadow-lg border-brand-300'
                          : 'border-gray-200 dark:border-gray-800'
                      } ${!service.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Drag handle */}
                      <div {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab flex-shrink-0">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{service.name}</p>
                          {!service.is_active && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{service.description}</p>
                        )}
                        <div className="flex gap-3 mt-1">
                          <span className="text-sm font-semibold text-brand-600">{formatCurrency(service.price)}</span>
                          <span className="text-xs text-gray-400">{formatDuration(service.duration_minutes)}</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => toggleActive(service)}
                        />
                        <button
                          onClick={() => startEdit(service)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {services.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Nenhum serviço cadastrado</p>
          <p className="text-sm mt-1">Adicione o primeiro serviço do seu salão.</p>
        </div>
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full py-6 border-dashed">
          <Plus className="w-5 h-5" />
          Adicionar Serviço
        </Button>
      )}
    </div>
  )
}
