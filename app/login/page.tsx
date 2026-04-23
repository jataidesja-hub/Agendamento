import { Suspense } from 'react'
import { LoginForm } from '@/components/dashboard/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <LoginForm />
    </Suspense>
  )
}
