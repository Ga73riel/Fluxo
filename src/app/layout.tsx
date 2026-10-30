import React from 'react'
import type { Metadata } from 'next'
import './styles.css'

const title = 'FLUXO BICT — Planejador Acadêmico UFMA'
const description =
  'Organograma, planejamento de créditos e grade semanal para BICT e Engenharias da UFMA.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-zinc-950 antialiased">
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
