'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { Cursor } from './Cursor'
import { PalcoContext, STAGE_H, STAGE_W, type CursorApi } from './useTimeline'

type Props = {
  titulo: string
  children: ReactNode
}

/**
 * Moldura de janela desktop (o Senderix é um app Electron) com o palco em
 * tamanho real reduzido por transform: scale(). A altura reservada vem do
 * aspect-ratio, então a página não se mexe antes nem depois da medição.
 */
export function AppWindow({ titulo, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const cursor = useRef<CursorApi>(null)
  const [escala, setEscala] = useState(0)

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setEscala(e.contentRect.width / STAGE_W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const palco = useMemo(() => ({ stage, cursor }), [])

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(20_33_50/0.04),0_8px_24px_-12px_rgb(20_33_50/0.12)]">
      <div className="flex h-9 items-center justify-between border-b border-line px-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo height={14} />
          <span className="h-3.5 w-px bg-line-strong" />
          <span className="truncate text-[12px] font-medium text-muted">{titulo}</span>
        </div>
        {/* Mesmas bolinhas da janela do hero */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      <div ref={caixa} className="relative w-full overflow-hidden" style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}>
        {escala > 0 && (
          <PalcoContext.Provider value={palco}>
            <div
              ref={stage}
              aria-hidden="true"
              inert
              className="app-tour-stage absolute top-0 left-0 origin-top-left overflow-hidden select-none"
              style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${escala})` }}
            >
              {children}
              <Cursor ref={cursor} />
            </div>
          </PalcoContext.Provider>
        )}
      </div>
    </div>
  )
}
