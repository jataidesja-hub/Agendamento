import { AdminSidebar } from '@/components/admin/sidebar'

export const metadata = { title: { default: 'Superadmin', template: '%s | Admin' } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
