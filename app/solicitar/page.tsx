import { Suspense } from 'react'
import { RequestForm } from '@/components/public/request-form'

export const metadata = {
  title: 'Solicitar Acesso — AgendaBeauty',
  description: 'Solicite seu aplicativo de agendamento personalizado.',
}

export default function SolicitarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <RequestForm />
    </Suspense>
  )
}
