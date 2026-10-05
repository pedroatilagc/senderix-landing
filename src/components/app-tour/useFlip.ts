'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * Linhas que mudam de lugar deslizam até a posição nova (FLIP só com
 * transform). Cada filho animável precisa de data-flip com uma chave estável.
 */
export function useFlip(raiz: RefObject<HTMLElement | null>, desligado = false) {
  const tops = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const el = raiz.current
    if (!el) return
    const novos = new Map<string, number>()
    el.querySelectorAll<HTMLElement>('[data-flip]').forEach((filho) => {
      const chave = filho.dataset.flip!
      const top = filho.offsetTop
      novos.set(chave, top)
      const antes = tops.current.get(chave)
      if (!desligado && antes !== undefined && antes !== top) {
        filho.animate([{ transform: `translateY(${antes - top}px)` }, { transform: 'none' }], {
          duration: 320,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        })
      }
    })
    tops.current = novos
  })
}
