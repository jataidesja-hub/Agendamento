'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff, Scissors, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
      return
    }
    toast.success('Login realizado com sucesso!')
    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-lg mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AgendaBeauty</h1>
          <p className="text-sm text-gray-500 mt-1">Painel do Dono — Acesse sua conta</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              required
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              {...register('password')}
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Entrar
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* CTA para quem não tem acesso */}
        <div className="mt-4 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-brand-100 dark:border-gray-700 p-5 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-brand-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Ainda não tem acesso?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              Solicite seu aplicativo e nossa equipe entrará em contato pelo WhatsApp.
            </p>
          </div>
          <Link
            href="/solicitar"
            className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Solicitar meu aplicativo
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Acesso exclusivo para proprietários de salões cadastrados.
        </p>
      </div>
    </div>
  )
}
