'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Senha incorreta. Acesso negado.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/30 border border-red-800 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Superadmin</h1>
          <p className="text-sm text-gray-500 mt-1">Acesso restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Senha de administrador"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
