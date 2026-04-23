import Link from 'next/link'
import { Scissors } from 'lucide-react'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">AgendaBeauty</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          Sou profissional →
        </Link>
      </div>
    </header>
  )
}
