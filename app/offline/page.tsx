'use client'

export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full mb-4 text-3xl">
          📶
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sem conexão</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Verifique sua internet e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
