'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { IconBrandWhatsapp, IconChecks } from '@tabler/icons-react'
import {
  CENARIOS,
  FLUXO,
  INICIO_PONTO,
  NODE_H,
  ORDEM,
  faseFinal,
  type CenarioId,
  type ItemConversa,
  type Pt,
} from './hero/cenarios'

const PAUSA_FINAL = 2200
const ESPERA_INICIAL = 4000
const FADE_TROCA = 200
const INTERVALO_INICIO = 450

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

type Execucao = { id: CenarioId; auto: boolean; n: number }

export function FlowIllustration() {
  // `aba` responde na hora ao clique; `cenarioId` troca quando o conteúdo já sumiu no crossfade
  const [aba, setAba] = useState<CenarioId>('atendimento')
  const [cenarioId, setCenarioId] = useState<CenarioId>('atendimento')
  const [roteiroIdx, setRoteiroIdx] = useState(0)
  const [fase, setFase] = useState(() => faseFinal(CENARIOS.atendimento.roteiros[0]))
  const [vivo, setVivo] = useState(false)
  const [apagado, setApagado] = useState(false)
  // Sem interação os cenários se alternam; o primeiro clique fixa o escolhido
  const [execucao, setExecucao] = useState<Execucao>({ id: 'atendimento', auto: true, n: 0 })

  const ponto = useRef<HTMLDivElement>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const abas = useRef<Record<CenarioId, HTMLButtonElement | null>>({ atendimento: null, campanha: null })
  const exibido = useRef<CenarioId>('atendimento')
  const reduzido = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reduzido.current = true
      return
    }
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

    const proximoRoteiro: Record<CenarioId, number> = { atendimento: 0, campanha: 0 }

    ;(async () => {
      // Na primeira carga o visitante vê o estado final completo; depois a demonstração roda
      if (execucao.n === 0) await esperar(ESPERA_INICIAL)
      let id = execucao.id
      while (!cancelado) {
        await quandoVisivel()
        if (cancelado) return
        const cenario = CENARIOS[id]
        const r = proximoRoteiro[id]
        proximoRoteiro[id] = (r + 1) % cenario.roteiros.length

        setVivo(true)
        setFase(0)
        if (id !== exibido.current) {
          // Crossfade: some o conteúdo, troca os dados, volta já vazio
          setAba(id)
          setApagado(true)
          await esperar(FADE_TROCA)
          if (cancelado) return
          exibido.current = id
          setCenarioId(id)
          setRoteiroIdx(r)
          setApagado(false)
          await esperar(INTERVALO_INICIO - FADE_TROCA)
        } else {
          await esperar(INTERVALO_INICIO)
        }
        if (cancelado) return
        setRoteiroIdx(r)

        for (const [f, ms] of cenario.roteiros[r].passos) {
          await esperar(ms)
          if (cancelado) return
          setFase(f)
        }
        await esperar(PAUSA_FINAL)
        if (cancelado) return
        if (execucao.auto) id = id === 'atendimento' ? 'campanha' : 'atendimento'
      }
    })()

    const el = ponto.current
    return () => {
      cancelado = true
      clearTimeout(timer)
      io.disconnect()
      // Sem restos do cenário anterior: o ponto para onde estiver e volta ao início na fase 0
      el?.getAnimations().forEach((a) => a.cancel())
    }
  }, [execucao])

  const cenario = CENARIOS[cenarioId]
  const roteiro = cenario.roteiros[roteiroIdx]

  useEffect(() => {
    const el = ponto.current
    if (!el || !vivo) return
    if (fase === 0) {
      el.getAnimations().forEach((a) => a.cancel())
      el.style.transform = translate(INICIO_PONTO)
    }
    const p = roteiro.percursos.find((x) => x.fase === fase)
    if (p) percorrer(el, p.pontos, p.dur)
  }, [fase, roteiro, vivo])

  function escolher(id: CenarioId) {
    setAba(id)
    if (reduzido.current) {
      exibido.current = id
      setCenarioId(id)
      setRoteiroIdx(0)
      setFase(faseFinal(CENARIOS[id].roteiros[0]))
      return
    }
    setExecucao((e) => ({ id, auto: false, n: e.n + 1 }))
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    const atual = ORDEM.findIndex((id) => abas.current[id] === document.activeElement)
    if (atual < 0) return
    let alvo: number | null = null
    if (e.key === 'ArrowRight') alvo = (atual + 1) % ORDEM.length
    if (e.key === 'ArrowLeft') alvo = (atual - 1 + ORDEM.length) % ORDEM.length
    if (e.key === 'Home') alvo = 0
    if (e.key === 'End') alvo = ORDEM.length - 1
    if (alvo === null) return
    e.preventDefault()
    abas.current[ORDEM[alvo]]?.focus()
  }

  const on = (cond: boolean) => (cond ? 'true' : 'false')
  const rastroDa = (linha: string) => roteiro.rastros.find((r) => r.linha === linha)

  return (
    <div>
      <div
        role="tablist"
        aria-label="Cenário da demonstração"
        onKeyDown={teclado}
        className="inline-flex rounded-md border border-line p-0.5"
      >
        {ORDEM.map((id) => {
          const ativo = id === aba
          return (
            <button
              key={id}
              ref={(el) => {
                abas.current[id] = el
              }}
              type="button"
              role="tab"
              id={`cenario-aba-${id}`}
              aria-selected={ativo}
              aria-controls="cenario-painel"
              tabIndex={ativo ? 0 : -1}
              onClick={() => escolher(id)}
              className={`h-7 rounded-[5px] px-3 text-[13px] font-medium transition-colors duration-150 ${
                ativo ? 'bg-subtle text-fg-strong' : 'text-muted hover:text-fg'
              }`}
            >
              {CENARIOS[id].rotulo}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="cenario-painel"
        aria-labelledby={`cenario-aba-${aba}`}
        tabIndex={0}
        className="mt-3 rounded-md"
      >
        <p key={aba} className="fade-in text-[13px] leading-5 text-muted">
          {CENARIOS[aba].descricao}
        </p>

        <div
          ref={raiz}
          aria-hidden="true"
          className="mt-4 select-none overflow-hidden rounded-xl border border-line bg-surface"
        >
          {/* Barra de janela no estilo macOS */}
          <div className="flex h-9 items-center gap-2 border-b border-line px-4">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div
            className={`flex justify-center gap-5 p-3 transition-opacity duration-200 sm:p-5 ${
              apagado ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Conversa */}
            {/* Altura fixa pela conversa mais alta (Campanha): trocar de cenário não move a página */}
            <div className="flex h-[420px] w-full sm:h-[456px] flex-col overflow-hidden rounded-lg border border-line bg-bg sm:w-[236px] sm:shrink-0">
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
                <div className="flex items-center gap-2">
                  <IconBrandWhatsapp size={16} stroke={1.75} className="text-whatsapp" />
                  <span className="text-[13px] font-medium text-fg-strong">Nova conversa</span>
                </div>
                <span className="font-mono text-[11px] text-muted">agora</span>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-3 text-[13px] leading-snug">
                {roteiro.conversa.map((posicao, i) => (
                  <div key={`${cenarioId}-${i}`} className="grid justify-items-end">
                    {posicao.map((item, j) => (
                      <Item key={j} item={item} fase={fase} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Fluxo */}
            <div className="hidden w-[288px] shrink-0 sm:block">
              <div className="flex h-11 items-center">
                <span className="font-mono text-[11px] tracking-wide text-muted uppercase">{cenario.tituloFluxo}</span>
              </div>
              <div className="relative" style={{ width: FLUXO.w, height: FLUXO.h }}>
                <svg
                  width={FLUXO.w}
                  height={FLUXO.h}
                  viewBox={`0 0 ${FLUXO.w} ${FLUXO.h}`}
                  fill="none"
                  className="absolute inset-0"
                >
                  {cenario.linhas.map((l) => (
                    <path key={l.id} d={l.d} stroke="var(--line-strong)" strokeWidth="1" />
                  ))}
                  {cenario.linhas.map((l) => {
                    const r = rastroDa(l.id)
                    return (
                      <Rastro
                        key={`${cenarioId}-${l.id}`}
                        d={l.d}
                        ativo={!!r && fase >= r.fase}
                        dur={r?.dur ?? 0}
                      />
                    )
                  })}
                </svg>

                <div
                  ref={ponto}
                  className="absolute top-0 left-0 z-10 size-2 rounded-full bg-accent transition-opacity duration-200"
                  style={{ transform: translate(INICIO_PONTO), opacity: vivo && fase >= 1 ? 1 : 0 }}
                />

                {cenario.nos.map((n) => {
                  const I = n.icon
                  const acende = roteiro.nosAcesos[n.id]
                  const pulso = roteiro.pulsos?.[n.id]
                  return (
                    <div
                      key={`${cenarioId}-${n.id}`}
                      data-on={on(acende !== undefined && fase >= acende)}
                      data-pulse={on(vivo && !!pulso && fase >= pulso[0] && fase <= pulso[1])}
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
      </div>
    </div>
  )
}

function Item({ item, fase }: { item: ItemConversa; fase: number }) {
  const on = (cond: boolean) => (cond ? 'true' : 'false')

  if (item.tipo === 'marcador') {
    return (
      <p
        className="reveal justify-self-center font-mono text-[11px] text-muted [grid-area:1/1]"
        data-on={on(fase >= item.de)}
      >
        {item.texto}
      </p>
    )
  }

  if (item.tipo === 'cliente') {
    return (
      <div
        className="reveal max-w-[85%] justify-self-start rounded-lg rounded-tl-sm border border-line bg-surface px-3 py-2 text-fg-strong [grid-area:1/1]"
        data-on={on(fase >= item.de)}
      >
        {item.texto}
      </div>
    )
  }

  if (item.tipo === 'digitando') {
    return <Digitando visivel={fase >= item.de && fase <= item.ate} />
  }

  return (
    <div
      className="reveal w-[88%] rounded-lg rounded-tr-sm bg-subtle px-3 pt-2 pb-1.5 text-fg-strong [grid-area:1/1]"
      data-on={on(fase >= item.de)}
    >
      <p>{item.texto}</p>
      {item.opcoes && (
        <div className="mt-2 flex flex-col gap-1.5">
          {item.opcoes.lista.map((op, i) => (
            <span
              key={op}
              data-on={on(fase >= item.opcoes!.tocadaEm && i === item.opcoes!.tocada)}
              className="flow-node rounded-md border border-line-strong bg-bg py-1.5 text-center text-[12.5px] font-medium text-fg"
            >
              {op}
            </span>
          ))}
        </div>
      )}
      <Lido lido={item.lidoEm !== null && fase >= item.lidoEm} />
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
