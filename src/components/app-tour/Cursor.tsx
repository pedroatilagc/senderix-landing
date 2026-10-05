'use client'

import { useImperativeHandle, useRef, type Ref } from 'react'
import type { CursorApi } from './useTimeline'

// Onde o cursor descansa antes de cada roteiro (canto inferior direito do palco)
const INICIO: [number, number] = [1060, 600]
const EASING = 'cubic-bezier(0.65, 0, 0.35, 1)'

const translate = ([x, y]: [number, number]) => `translate(${x}px, ${y}px)`

export function Cursor({ ref }: { ref: Ref<CursorApi> }) {
  const raiz = useRef<HTMLDivElement>(null)
  const seta = useRef<SVGSVGElement>(null)
  const anel = useRef<HTMLSpanElement>(null)
  const pos = useRef<[number, number]>(INICIO)

  useImperativeHandle(ref, () => ({
    pos: () => pos.current,
    mover(x, y, dur) {
      const el = raiz.current
      if (!el) return
      const de = pos.current
      pos.current = [x, y]
      // O estilo já fica no destino; a animação só interpola até lá
      el.style.transform = translate([x, y])
      el.animate([{ transform: translate(de) }, { transform: translate([x, y]) }], { duration: dur, easing: EASING })
    },
    clicar() {
      anel.current?.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0.55 },
          { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
        ],
        { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      )
    },
    pressionar(on) {
      if (seta.current) seta.current.style.transform = on ? 'scale(0.88)' : ''
    },
    mostrar(on) {
      if (raiz.current) raiz.current.style.opacity = on ? '1' : '0'
    },
    reiniciar() {
      const el = raiz.current
      if (!el) return
      el.getAnimations().forEach((a) => a.cancel())
      pos.current = INICIO
      el.style.transform = translate(INICIO)
      el.style.opacity = '0'
      if (seta.current) seta.current.style.transform = ''
    },
  }))

  return (
    <div
      ref={raiz}
      className="pointer-events-none absolute top-0 left-0 z-[100] transition-opacity duration-200"
      style={{ transform: translate(INICIO), opacity: 0 }}
    >
      <span
        ref={anel}
        className="absolute top-0 left-0 size-9 rounded-full border-2 border-slate-900/60 opacity-0 dark:border-white/70"
      />
      <svg
        ref={seta}
        width="22"
        height="26"
        viewBox="0 0 22 26"
        className="block origin-top-left drop-shadow-[0_2px_3px_rgb(0_0_0/0.3)] transition-transform duration-100"
      >
        <path
          d="M1.5 1.5v19.2l4.9-4.6 3.2 7.3 3.4-1.5-3.2-7.1h6.8z"
          fill="#fff"
          stroke="#0f172a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
