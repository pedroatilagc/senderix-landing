'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconBrandWhatsapp,
  IconCalendar,
  IconChecks,
  IconHeadset,
  IconListDetails,
  IconMessage,
  IconMoodSmile,
  type Icon,
} from '@tabler/icons-react'

/*
 * Sequência (fases):
 * 0 vazio · 1 cliente escreve · 2 digitando · 3 saudação · 4 menu enviado
 * 5 nó Menu · 6 opção tocada · 7 digitando · 8 confirmação
 * Sem JS ou com prefers-reduced-motion, fica parada na fase 8 (estado final).
 */

const OPCOES = ['Agendar', 'Preços', 'Falar com atendente'] as const

const CENARIOS = [
  {
    cliente: 'Oi, queria marcar um horário',
    escolha: 0,
    resposta: 'Ótimo! Qual dia fica melhor para você?',
  },
  {
    cliente: 'Oi, preciso falar com alguém da equipe',
    escolha: 2,
    resposta: 'Certo. Já avisei a equipe, alguém vai te responder por aqui.',
  },
] as const

// [fase, espera em ms antes de entrar nela]
const PASSOS: Array<[number, number]> = [
  [1, 600],
  [2, 600],
  [3, 500],
  [4, 600],
  [5, 500],
  [6, 1100],
  [7, 700],
  [8, 700],
]
const PAUSA_FINAL = 2200
const ESPERA_INICIAL = 4000
const FASE_FINAL = 8

// Geometria do fluxo (px, dentro de uma área de 288×290)
const CX = 144
type No = { id: string; label: string; icon: Icon; x: number; y: number; w: number }
const NOS: No[] = [
  { id: 'recebida', label: 'Mensagem recebida', icon: IconMessage, x: 59, y: 16, w: 170 },
  { id: 'saudacao', label: 'Saudação', icon: IconMoodSmile, x: 59, y: 88, w: 170 },
  { id: 'menu', label: 'Menu', icon: IconListDetails, x: 59, y: 160, w: 170 },
  { id: 'agendar', label: 'Agendar', icon: IconCalendar, x: 0, y: 244, w: 140 },
  { id: 'atendente', label: 'Atendente humano', icon: IconHeadset, x: 148, y: 244, w: 140 },
]
const NODE_H = 36
const mid = (n: No) => n.y + NODE_H / 2

// O ponto anda de centro a centro dos nós (por baixo deles, que são opacos)
type Pt = [number, number]
const TRECHO_1: Pt[] = [[CX, mid(NOS[0])], [CX, mid(NOS[1])]]
const TRECHO_2: Pt[] = [[CX, mid(NOS[1])], [CX, mid(NOS[2])]]
const RAMOS: Pt[][] = [
  [[CX, mid(NOS[2])], [CX, 220], [70, 220], [70, mid(NOS[3])]],
  [[CX, mid(NOS[2])], [CX, 220], [218, 220], [218, mid(NOS[4])]],
]
const DUR = { curto: 500, ramo: 700 }

const LINHAS = {
  l1: `M${CX} 52 V88`,
  l2: `M${CX} 124 V160`,
  ramo0: `M${CX} 196 V214 Q${CX} 220 ${CX - 6} 220 H76 Q70 220 70 226 V244`,
  ramo1: `M${CX} 196 V214 Q${CX} 220 ${CX + 6} 220 H212 Q218 220 218 226 V244`,
}

const translate = ([x, y]: Pt) => `translate(${x - 4}px, ${y - 4}px)`

function percorrer(el: HTMLElement, pts: Pt[], duration: number) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, b) => a + b, 0)
  let acc = 0
  const frames = pts.map((p, i) => {
    if (i > 0) acc += seg[i - 1]
    return { transform: translate(p), offset: acc / total }
  })
  el.animate(frames, { duration, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' })
}

export function FlowIllustration() {
  const [fase, setFase] = useState(FASE_FINAL)
  const [cenario, setCenario] = useState(0)
  const [vivo, setVivo] = useState(false)
  const ponto = useRef<HTMLDivElement>(null)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelado = false
    let timer: ReturnType<typeof setTimeout>
    const esperar = (ms: number) => new Promise<void>((r) => (timer = setTimeout(r, ms)))

    // Só anima enquanto a ilustração está na tela
    let visivel = false
    let acordar: (() => void) | null = null
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting
      if (visivel && acordar) {
        acordar()
        acordar = null
      }
    })
    if (raiz.current) io.observe(raiz.current)
    const quandoVisivel = () => (visivel ? Promise.resolve() : new Promise<void>((r) => (acordar = r)))

    ;(async () => {
      // Primeiro o visitante vê o estado final completo; depois a demonstração roda
      await esperar(ESPERA_INICIAL)
      let c = 1
      while (!cancelado) {
        await quandoVisivel()
        if (cancelado) return
        setVivo(true)
        setFase(0)
        c = 1 - c
        await esperar(450)
        if (cancelado) return
        setCenario(c)
        for (const [f, ms] of PASSOS) {
          await esperar(ms)
          if (cancelado) return
          setFase(f)
        }
        await esperar(PAUSA_FINAL)
      }
    })()

    return () => {
      cancelado = true
      clearTimeout(timer)
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    const el = ponto.current
    if (!el || !vivo) return
    if (fase === 0) {
      el.getAnimations().forEach((a) => a.cancel())
      el.style.transform = translate(TRECHO_1[0])
    }
    if (fase === 2) percorrer(el, TRECHO_1, DUR.curto)
    if (fase === 4) percorrer(el, TRECHO_2, DUR.curto)
    if (fase === 6) percorrer(el, RAMOS[cenario], DUR.ramo)
  }, [fase, cenario, vivo])

  const c = CENARIOS[cenario]
  const on = (cond: boolean) => (cond ? 'true' : 'false')
  const noAceso = (i: number) =>
    i === 0 ? fase >= 1 : i === 1 ? fase >= 3 : i === 2 ? fase >= 5 : fase >= 7 && i - 3 === (c.escolha === 0 ? 0 : 1)
  const ramo = c.escolha === 0 ? 0 : 1

  return (
    <div ref={raiz} aria-hidden="true" className="select-none rounded-xl border border-line bg-surface p-3 sm:p-5">
      <div className="flex justify-center gap-5">
        {/* Conversa */}
        <div className="flex h-[340px] w-full sm:h-[372px] flex-col overflow-hidden rounded-lg border border-line bg-bg sm:w-[236px] sm:shrink-0">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
            <div className="flex items-center gap-2">
              <IconBrandWhatsapp size={16} stroke={1.75} className="text-whatsapp" />
              <span className="text-[13px] font-medium text-fg-strong">Nova conversa</span>
            </div>
            <span className="font-mono text-[11px] text-muted">agora</span>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 p-3 text-[13px] leading-snug">
            <div
              className="reveal max-w-[85%] self-start rounded-lg rounded-tl-sm border border-line bg-surface px-3 py-2 text-fg-strong"
              data-on={on(fase >= 1)}
            >
              {c.cliente}
            </div>

            <div className="grid justify-items-end">
              <Digitando visivel={fase === 2 || fase === 3} />
              <div
                className="reveal w-[88%] rounded-lg rounded-tr-sm bg-subtle px-3 pt-2 pb-1.5 text-fg-strong [grid-area:1/1]"
                data-on={on(fase >= 4)}
              >
                <p>Olá! Escolha uma opção:</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {OPCOES.map((op, i) => (
                    <span
                      key={op}
                      data-on={on(fase >= 6 && i === c.escolha)}
                      className="flow-node rounded-md border border-line-strong bg-bg py-1.5 text-center text-[12.5px] font-medium text-fg"
                    >
                      {op}
                    </span>
                  ))}
                </div>
                <Lido lido={fase >= 6} />
              </div>
            </div>

            <div className="grid justify-items-end">
              <Digitando visivel={fase === 7} />
              <div
                className="reveal w-[88%] rounded-lg rounded-tr-sm bg-subtle px-3 pt-2 pb-1.5 text-fg-strong [grid-area:1/1]"
                data-on={on(fase >= 8)}
              >
                <p>{c.resposta}</p>
                <Lido lido={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Fluxo */}
        <div className="hidden w-[288px] shrink-0 sm:block">
          <div className="flex h-11 items-center">
            <span className="font-mono text-[11px] tracking-wide text-muted uppercase">Fluxo · Atendimento</span>
          </div>
          <div className="relative h-[290px] w-[288px]">
            <svg width="288" height="290" viewBox="0 0 288 290" fill="none" className="absolute inset-0">
              {Object.values(LINHAS).map((d) => (
                <path key={d} d={d} stroke="var(--line-strong)" strokeWidth="1" />
              ))}
              <Rastro d={LINHAS.l1} ativo={fase >= 2} dur={DUR.curto} />
              <Rastro d={LINHAS.l2} ativo={fase >= 4} dur={DUR.curto} />
              <Rastro d={LINHAS.ramo0} ativo={fase >= 6 && ramo === 0} dur={DUR.ramo} />
              <Rastro d={LINHAS.ramo1} ativo={fase >= 6 && ramo === 1} dur={DUR.ramo} />
            </svg>

            <div
              ref={ponto}
              className="absolute top-0 left-0 z-10 size-2 rounded-full bg-accent transition-opacity duration-200"
              style={{ transform: translate(TRECHO_1[0]), opacity: vivo && fase >= 1 ? 1 : 0 }}
            />

            {NOS.map((n, i) => {
              const I = n.icon
              return (
                <div
                  key={n.id}
                  data-on={on(noAceso(i))}
                  className="flow-node absolute z-20 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-bg px-2 text-[12px] font-medium whitespace-nowrap text-fg"
                  style={{ left: n.x, top: n.y, width: n.w, height: NODE_H }}
                >
                  <I size={14} stroke={1.75} className="shrink-0" />
                  {n.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Digitando({ visivel }: { visivel: boolean }) {
  return (
    <div
      className="reveal typing flex h-8 items-center gap-1 rounded-lg rounded-tr-sm bg-subtle px-3 [grid-area:1/1]"
      data-on={visivel ? 'true' : 'false'}
    >
      <span className="size-1.5 rounded-full bg-muted" />
      <span className="size-1.5 rounded-full bg-muted" />
      <span className="size-1.5 rounded-full bg-muted" />
    </div>
  )
}

function Lido({ lido }: { lido: boolean }) {
  return (
    <div className="mt-1 flex justify-end">
      <IconChecks
        size={14}
        stroke={1.75}
        className={`transition-colors duration-300 ${lido ? 'text-accent-text' : 'text-faint'}`}
      />
    </div>
  )
}

function Rastro({ d, ativo, dur }: { d: string; ativo: boolean; dur: number }) {
  // O ponto fica escondido sob os nós em ~20% do trajeto em cada ponta
  return (
    <path
      d={d}
      pathLength={1}
      stroke="var(--accent)"
      strokeWidth="1.5"
      className="flow-trail"
      data-on={ativo ? 'true' : 'false'}
      style={ativo ? { transitionDuration: `${dur * 0.6}ms`, transitionDelay: `${dur * 0.2}ms` } : undefined}
    />
  )
}
