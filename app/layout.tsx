import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'AgendaBeauty — Agendamento Online para Salões',
    template: '%s | AgendaBeauty',
  },
  description: 'Plataforma de agendamento online para salões, barbearias, manicures e muito mais.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgendaBeauty',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'AgendaBeauty',
    description: 'Agende seus serviços de beleza com facilidade.',
  },
}

export const viewport: Viewport = {
  themeColor: '#d946ef',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          expand={false}
          toastOptions={{
            style: { borderRadius: '12px' },
          }}
        />
      </body>
    </html>
  )
}
