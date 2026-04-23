'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, CheckCircle, Smartphone } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export function NotificationsManager({ salonId }: { salonId: string }) {
  const supabase = createClient()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported] = useState(
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  )

  async function subscribePush() {
    if (!supported) { toast.error('Web Push não suportado neste navegador'); return }
    setLoading(true)

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Permissão de notificação negada')
        setLoading(false)
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        toast.error('Chave VAPID não configurada')
        setLoading(false)
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
      })

      const subJson = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({
        salon_id: salonId,
        endpoint: subJson.endpoint!,
        p256dh: (subJson.keys as any).p256dh,
        auth: (subJson.keys as any).auth,
      })

      if (error) { toast.error(error.message); setLoading(false); return }

      setSubscribed(true)
      toast.success('Notificações push ativadas!')
    } catch (err) {
      toast.error('Erro ao ativar notificações')
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribePush() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await supabase.from('push_subscriptions')
          .delete()
          .eq('salon_id', salonId)
          .eq('endpoint', sub.endpoint)
      }
      setSubscribed(false)
      toast.success('Notificações desativadas')
    } catch {
      toast.error('Erro ao desativar notificações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações Push</CardTitle>
          <CardDescription>
            Receba alertas no seu dispositivo quando um novo agendamento chegar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supported ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <BellOff className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Seu navegador não suporta notificações push. Use Chrome ou Firefox para esta funcionalidade.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className={`p-3 rounded-xl ${subscribed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Bell className={`w-5 h-5 ${subscribed ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notificações de Novos Agendamentos
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscribed ? 'Ativo neste dispositivo' : 'Inativo'}
                  </p>
                </div>
                <Switch
                  checked={subscribed}
                  onCheckedChange={(checked) => checked ? subscribePush() : unsubscribePush()}
                  disabled={loading}
                />
              </div>

              {subscribed && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Este dispositivo receberá notificações de novos agendamentos.
                </div>
              )}

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Dica: Instale como App</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      Adicione esta página à tela inicial do seu celular para receber notificações mesmo com o navegador fechado.
                      No Chrome: Menu → &ldquo;Adicionar à tela inicial&rdquo;.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Info */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmação via WhatsApp</CardTitle>
          <CardDescription>
            Ao confirmar um agendamento, um link de WhatsApp será gerado automaticamente para enviar ao cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400">
              Esta funcionalidade já está configurada. Ao clicar em &ldquo;Confirmar&rdquo; em um agendamento,
              um botão de WhatsApp aparecerá para enviar a confirmação ao cliente com todos os detalhes do agendamento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
