'use client'

import { User } from '@supabase/supabase-js'
import { Bell, Sun, Moon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Salon } from '@/types'
import { useEffect, useState } from 'react'

export function DashboardHeader({ user, salon }: { user: User; salon: Salon | null }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    const isDark = html.classList.contains('dark')
    html.classList.toggle('dark', !isDark)
    localStorage.setItem('theme', isDark ? 'light' : 'dark')
    setDark(!isDark)
  }

  const initials = (user.email || 'U').slice(0, 2).toUpperCase()

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {salon?.is_active === false && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
            Salão Inativo
          </span>
        )}
        {salon?.is_active && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
            Salão Ativo
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Avatar className="w-8 h-8">
          <AvatarImage src={salon?.logo_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
            {salon?.name || 'Meu Salão'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>
    </header>
  )
}
