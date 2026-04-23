'use client'

import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Upload, Camera, Save, Globe } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SALON_CATEGORIES, type Salon, type SalonCategory } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  categories: z.array(z.string()).min(1, 'Selecione ao menos uma categoria'),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ProfileForm({ salon, userId }: { salon: Salon | null; userId: string }) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(salon?.logo_url || null)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(salon?.logo_url || null)

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: salon?.name || '',
      description: salon?.description || '',
      primary_color: salon?.primary_color || '#d946ef',
      secondary_color: salon?.secondary_color || '#a21caf',
      categories: salon?.categories || [],
      whatsapp: salon?.whatsapp || '',
      instagram: salon?.instagram || '',
      phone: salon?.phone || '',
      email: salon?.email || '',
      address: salon?.address || '',
      city: salon?.city || '',
      state: salon?.state || '',
      zip_code: salon?.zip_code || '',
    },
  })

  const watchedName = watch('name')
  const watchedPrimary = watch('primary_color')
  const watchedSecondary = watch('secondary_color')

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)

    const ext = file.name.split('.').pop()
    const path = `logos/${userId}/${Date.now()}.${ext}`

    const { error, data } = await supabase.storage
      .from('salon-assets')
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error('Erro ao fazer upload da imagem')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('salon-assets').getPublicUrl(path)
    setLogoUrl(publicUrl)
    toast.success('Logo carregado com sucesso!')
    setUploading(false)
  }

  async function onSubmit(data: FormData) {
    const slug = generateSlug(data.name)
    const payload = {
      ...data,
      logo_url: logoUrl,
      owner_id: userId,
      slug: salon?.slug || slug,
    }

    if (salon?.id) {
      const { error } = await supabase
        .from('salons')
        .update(payload)
        .eq('id', salon.id)

      if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('salons')
        .insert({ ...payload, slug })

      if (error) { toast.error('Erro ao criar salão: ' + error.message); return }
    }

    toast.success('Perfil salvo com sucesso!')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo do Salão</CardTitle>
          <CardDescription>Imagem exibida na sua página pública e no app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand-400 transition-colors relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" fill className="object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Carregando...' : 'Carregar imagem'}
              </Button>
              <p className="text-xs text-gray-400">JPG, PNG ou WebP. Máx 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome do Salão"
            placeholder="Ex: Salão da Maria"
            required
            {...register('name')}
            error={errors.name?.message}
            helper={watchedName ? `Slug: /${generateSlug(watchedName)}` : undefined}
          />
          <Textarea
            label="Descrição / Slogan"
            placeholder="Descreva seu salão em poucas palavras..."
            rows={3}
            {...register('description')}
          />

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cor Primária
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  {...register('primary_color')}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{watchedPrimary}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cor Secundária
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  {...register('secondary_color')}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{watchedSecondary}</span>
              </div>
            </div>
          </div>

          {/* Preview de cor */}
          <div
            className="h-12 rounded-xl flex items-center justify-center text-sm font-medium text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${watchedPrimary}, ${watchedSecondary})` }}
          >
            Preview da cor do seu salão
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias do Negócio</CardTitle>
          <CardDescription>Selecione os serviços que você oferece.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="categories"
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(SALON_CATEGORIES).map(([key, label]) => {
                  const selected = field.value.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        field.onChange(
                          selected
                            ? field.value.filter((v) => v !== key)
                            : [...field.value, key]
                        )
                      }}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                        selected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.categories && (
            <p className="text-xs text-red-500 mt-2">{errors.categories.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Contato e Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="WhatsApp"
              placeholder="5511999999999"
              {...register('whatsapp')}
              helper="Com código do país. Ex: 5511999999999"
            />
            <Input
              label="Instagram"
              placeholder="@seusalao"
              {...register('instagram')}
            />
            <Input
              label="Telefone"
              placeholder="(11) 3333-4444"
              {...register('phone')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@seusalao.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
          <CardDescription>Usado para exibir no mapa e calcular distância.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Endereço completo"
            placeholder="Rua das Flores, 123 — Bairro"
            {...register('address')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" placeholder="São Paulo" {...register('city')} />
            <Input label="Estado" placeholder="SP" maxLength={2} {...register('state')} />
          </div>
          <Input label="CEP" placeholder="00000-000" {...register('zip_code')} />
        </CardContent>
      </Card>

      {/* Link público */}
      {salon?.slug && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sua página pública está em:
                </p>
                <a
                  href={`/${salon.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline truncate block"
                >
                  {process.env.NEXT_PUBLIC_APP_URL}/{salon.slug}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isSubmitting}>
          <Save className="w-4 h-4" />
          Salvar Perfil
        </Button>
      </div>
    </form>
  )
}
