'use client'

import { useEffect, useState } from 'react'
import { WHATSAPP_LINK } from '@/config/site'
import { Logo } from './Logo'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color] duration-200 data-[scrolled=true]:border-line data-[scrolled=true]:bg-bg/90 data-[scrolled=true]:backdrop-blur-sm"
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-[1168px] items-center justify-between px-4 sm:px-6"
      >
        <a href="#topo" className="-m-1 p-1" aria-label="Senderix, voltar ao início">
          <Logo height={26} preload />
        </a>
        <div className="flex items-center gap-6">
          <a
            href="#planos"
            className="hidden text-sm font-medium text-fg-strong transition-colors hover:text-accent-text sm:inline"
          >
            Planos
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            Falar com a gente
          </a>
        </div>
      </nav>
    </header>
  )
}
