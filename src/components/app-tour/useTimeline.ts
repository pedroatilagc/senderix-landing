'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type RefObject } from 'react'

// Palco em tamanho real: a janela padrão do app Electron (1280×800) menos a
// barra de título do Windows. A moldura reduz tudo com transform: scale().
export const STAGE_W = 1280
export const STAGE_H = 712

const ESPERA_INICIAL = 700
const PAUSA_FINAL = 2500

export type CursorApi = {
  /** Posição atual da ponta da seta, em px do palco */
  pos(): [number, number]
  mover(x: number, y: number, dur: number): void
  clicar(): void
  pressionar(on: boolean): void
  mostrar(on: boolean): void
  reiniciar(): void
}

export type Palco = {
  stage: RefObject<HTMLDivElement | null>
  cursor: RefObject<CursorApi | null>
}

export const PalcoContext = createContext<Palco | null>(null)

type OpcoesMover = {
  /** Deslocamento a partir do centro do alvo, em px do palco */
  dx?: number
  dy?: number
  /** Chamado quando o movimento começa, com a duração calculada */
  aoIniciar?: (dur: number) => void
}

export type Tour = {
  esperar(ms: number): Promise<void>
  mover(alvo: string, opcoes?: OpcoesMover): Promise<void>
  /** Move até o alvo, pressiona e solta; o estado muda depois de soltar, como num clique real */
  clicar(alvo: string, opcoes?: OpcoesMover): Promise<void>
  pressionar(on: boolean): void
  /** Digita caractere a caractere, chamando `aplicar` com o texto parcial */
  digitar(texto: string, aplicar: (parcial: string) => void, ms?: number): Promise<void>
  /** Apaga caractere a caractere, do texto atual até vazio */
  apagar(texto: string, aplicar: (parcial: string) => void, ms?: number): Promise<void>
}

export type Roteiro = (t: Tour) => Promise<void>

/** Props comuns de todas as telas */
export type TelaProps = {
  ativo: boolean
  chave: number
  /** Movimento reduzido: mostra o estado final do roteiro, sem cursor */
  estatico: boolean
  aoTerminar: () => void
}

/**
 * Estado de uma tela: começa no inicial (ou no final, com movimento reduzido)
 * e aceita atualizações parciais vindas do roteiro.
 */
export function useEstadoTela<T extends object>(inicial: T, final: T, estatico: boolean) {
  const [estado, setEstado] = useState<T>(estatico ? final : inicial)
  const set = useCallback(
    (p: Partial<T> | ((s: T) => Partial<T>)) => setEstado((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })),
    [],
  )
  const reiniciar = useCallback(() => setEstado(inicial), [inicial])
  return [estado, set, reiniciar] as const
}

const CANCELADO = Symbol('cancelado')

type Opcoes = {
  roteiro: Roteiro
  /** Restaura o estado inicial da tela antes de cada execução */
  reiniciar: () => void
  /** Falso pausa tudo; ao voltar, o roteiro recomeça do início */
  ativo: boolean
  /** Mudar a chave recomeça o roteiro (loop na mesma aba) */
  chave: number
  aoTerminar: () => void
}

/**
 * Motor de roteiro: executa os passos em sequência com setTimeout encadeado.
 * Cada passo aguarda o anterior; todos os timers e animações do cursor são
 * cancelados ao pausar, trocar de aba ou desmontar.
 */
export function useTimeline({ roteiro, reiniciar, ativo, chave, aoTerminar }: Opcoes) {
  const palco = useContext(PalcoContext)
  const atual = useRef({ roteiro, reiniciar, aoTerminar })

  useEffect(() => {
    atual.current = { roteiro, reiniciar, aoTerminar }
  })

  useEffect(() => {
    if (!ativo || !palco) return
    const { stage, cursor } = palco
    const cancelar = new Set<() => void>()
    let cancelado = false

    const esperar = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (cancelado) return reject(CANCELADO)
        const id = setTimeout(() => {
          cancelar.delete(desfazer)
          resolve()
        }, ms)
        const desfazer = () => {
          clearTimeout(id)
          reject(CANCELADO)
        }
        cancelar.add(desfazer)
      })

    const alvo = (nome: string) => stage.current?.querySelector<HTMLElement>(`[data-tour="${nome}"]`) ?? null

    // Centro do alvo em px do palco: mede na tela e desfaz a escala da moldura
    const pontoDe = (el: HTMLElement, dx = 0, dy = 0): [number, number] | null => {
      const s = stage.current
      if (!s) return null
      const rs = s.getBoundingClientRect()
      const k = rs.width / STAGE_W || 1
      const r = el.getBoundingClientRect()
      return [(r.left + r.width / 2 - rs.left) / k + dx, (r.top + r.height / 2 - rs.top) / k + dy]
    }

    const mover = async (nome: string, { dx, dy, aoIniciar }: OpcoesMover = {}) => {
      const el = alvo(nome)
      const c = cursor.current
      const p = el && pontoDe(el, dx, dy)
      if (!c || !p) return
      const [x0, y0] = c.pos()
      const dist = Math.hypot(p[0] - x0, p[1] - y0)
      const dur = Math.round(Math.min(700, Math.max(400, 380 + dist * 0.45)))
      c.mover(p[0], p[1], dur)
      aoIniciar?.(dur)
      await esperar(dur)
    }

    const tour: Tour = {
      esperar,
      mover,
      async clicar(nome, opcoes) {
        await mover(nome, opcoes)
        await esperar(90)
        const el = alvo(nome)
        el?.setAttribute('data-pressed', '')
        cursor.current?.pressionar(true)
        cursor.current?.clicar()
        await esperar(150)
        el?.removeAttribute('data-pressed')
        cursor.current?.pressionar(false)
        await esperar(110)
      },
      pressionar(on) {
        cursor.current?.pressionar(on)
      },
      async digitar(texto, aplicar, ms = 45) {
        for (let i = 1; i <= texto.length; i++) {
          aplicar(texto.slice(0, i))
          // Ritmo humano: pausa um pouco mais depois de espaço e pontuação
          await esperar(/[\s,.!?]/.test(texto[i - 1]) ? ms * 1.8 : ms)
        }
      },
      async apagar(texto, aplicar, ms = 55) {
        for (let i = texto.length - 1; i >= 0; i--) {
          aplicar(texto.slice(0, i))
          await esperar(ms)
        }
      },
    }

    // O reinício vai no primeiro timer, não no corpo do efeito: nada de setState síncrono aqui
    const inicio = setTimeout(async () => {
      atual.current.reiniciar()
      cursor.current?.reiniciar()
      try {
        await esperar(ESPERA_INICIAL)
        cursor.current?.mostrar(true)
        await atual.current.roteiro(tour)
        await esperar(PAUSA_FINAL)
        cursor.current?.mostrar(false)
        atual.current.aoTerminar()
      } catch (e) {
        if (e !== CANCELADO) throw e
      }
    }, 0)

    return () => {
      cancelado = true
      clearTimeout(inicio)
      cancelar.forEach((f) => f())
      cancelar.clear()
      cursor.current?.reiniciar()
    }
  }, [ativo, chave, palco])
}
