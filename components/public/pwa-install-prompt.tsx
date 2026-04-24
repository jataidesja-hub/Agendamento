'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Share, Plus, Download } from 'lucide-react'
import type { Salon } from '@/types'

interface Props {
  salon: Salon
}

type Platform = 'ios' | 'android' | null

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = (slug: string) => `pwa-dismissed-${slug}`

export function PwaInstallPrompt({ salon }: Props) {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem(DISMISSED_KEY(salon.slug))) return

    const ua = navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isAndroid = /Android/.test(ua)

    if (isIos) {
      // Only show in Safari (not Chrome/Firefox on iOS which can't install)
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua)
      if (!isSafari) return
      setPlatform('ios')
      // Small delay so page loads first
      setTimeout(() => setVisible(true), 2500)
    } else if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setPlatform('android')
        setTimeout(() => setVisible(true), 2500)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [salon.slug])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY(salon.slug), '1')
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      localStorage.setItem(DISMISSED_KEY(salon.slug), '1')
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  if (!visible || !platform) return null

  const primary = salon.primary_color || '#d946ef'

  return (
    <>
      {/* Backdrop blur leve */}
      <div className="fixed inset-0 z-40 pointer-events-none" aria-hidden />

      {/* Banner fixo na parte de baixo */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 animate-slide-up">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Barra colorida do salão */}
          <div className="h-1.5 w-full" style={{ background: primary }} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {/* Logo do salão */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md border border-gray-100 dark:border-gray-700"
                style={{ background: primary + '22' }}
              >
                {salon.logo_url ? (
                  <Image
                    src={salon.logo_url}
                    alt={salon.name}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: primary }}>
                    {salon.name[0]}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{salon.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Adicione à tela inicial</p>
              </div>

              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {platform === 'android' && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Instale o app do <strong>{salon.name}</strong> no seu celular para agendar com um toque, sem precisar abrir o navegador.
                </p>
                <button
                  onClick={installAndroid}
                  disabled={installing}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity active:opacity-80 disabled:opacity-60"
                  style={{ background: primary }}
                >
                  <Download className="w-4 h-4" />
                  {installing ? 'Instalando...' : 'Instalar aplicativo'}
                </button>
              </>
            )}

            {platform === 'ios' && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Instale o app do <strong>{salon.name}</strong> no seu iPhone em 2 passos:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: primary + '22' }}
                    >
                      <Share className="w-4 h-4" style={{ color: primary }} />
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Toque no botão <strong>Compartilhar</strong>{' '}
                      <span className="inline-block px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] align-middle">
                        ↑
                      </span>{' '}
                      na barra do Safari
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: primary + '22' }}
                    >
                      <Plus className="w-4 h-4" style={{ color: primary }} />
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Role para baixo e toque em{' '}
                      <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Entendi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
