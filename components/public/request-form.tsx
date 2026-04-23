'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  Scissors, ArrowLeft, CheckCircle2, User, Building2,
  Mail, Phone, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { maskPhone } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const schema = z.object({
  full_name:    z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  company_name: z.string().min(2, 'Nome da empresa obrigatório'),
  email:        z.string().email('E-mail inválido'),
  whatsapp:     z.string().min(14, 'WhatsApp inválido'),
})
type FormData = z.infer<typeof schema>

export function RequestForm() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submittedWA, setSubmittedWA] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const whatsappValue = watch('whatsapp', '')

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      whatsapp: data.whatsapp.replace(/\D/g, ''),
    }
    const { error } = await supabase.from('salon_requests').insert(payload)
    if (error) {
      alert('Erro ao enviar solicitação. Tente novamente.')
      return
    }
    setSubmittedName(data.full_name.split(' ')[0])
    setSubmittedWA(payload.whatsapp)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-slide-up">
          {/* Ícone de sucesso */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Solicitação enviada, {submittedName}!
            </h1>
            <p className="text-gray-500 mt-3 text-base leading-relaxed">
              Recebemos suas informações. Em breve nossa equipe entrará em contato com você pelo WhatsApp para apresentar o seu aplicativo.
            </p>
          </div>

          {/* WhatsApp confirmação */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              📱 Retornaremos no WhatsApp
            </p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              +{submittedWA.slice(0, 2)} ({submittedWA.slice(2, 4)}) {submittedWA.slice(4, 9)}-{submittedWA.slice(9)}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Voltar */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-lg mb-4 relative">
            <Scissors className="w-8 h-8 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-yellow-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quero meu aplicativo!
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Preencha os dados abaixo e nossa equipe entrará em contato pelo WhatsApp para configurar tudo para você.
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">

          {/* Benefícios rápidos */}
          <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            {[
              { emoji: '📅', label: 'Agendamentos online' },
              { emoji: '💬', label: 'Confirmação via WhatsApp' },
              { emoji: '📱', label: 'App para celular' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex-1 text-center">
                <div className="text-xl mb-1">{emoji}</div>
                <p className="text-xs text-gray-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome completo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  {...register('full_name')}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>

            {/* Nome da empresa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do salão / empresa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ex: Barbearia do João"
                  {...register('company_name')}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsappValue}
                  onChange={(e) => setValue('whatsapp', maskPhone(e.target.value))}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              {errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Solicitar meu aplicativo'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Entraremos em contato em até 24 horas úteis.
        </p>
      </div>
    </div>
  )
}
