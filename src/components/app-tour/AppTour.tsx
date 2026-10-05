'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import { IconChartDots3, IconMessageCircle, IconSend, IconUsers, type Icon } from '@tabler/icons-react'
import { AppWindow } from './AppWindow'
import type { AbaId } from './data'
import { AppShell, type ItemNav } from './ui'
import type { TelaProps } from './useTimeline'
import './app-tour.css'

type Aba = {
  id: AbaId
  rotulo: string
  /** Mesmo ícone do item na sidebar do app */
  Icon: Icon
  /** Nome da tela no app, mostrado na barra de título da janela */
  titulo: string
  nav: ItemNav
  legenda: string
}

const ABAS: Aba[] = [
  {
    id: 'fluxos',
    rotulo: 'Fluxos',
    Icon: IconChartDots3,
    titulo: 'Automação',
    nav: 'automacao',
    legenda: 'Monte o atendimento arrastando blocos.',
  },
  {
    id: 'atendimento',
    rotulo: 'Atendimento',
    Icon: IconMessageCircle,
    titulo: 'Mensagens',
    nav: 'mensagens',
    legenda: 'Quem precisa de uma pessoa chega até a sua equipe.',
  },
  {
    id: 'campanhas',
    rotulo: 'Campanhas',
    Icon: IconSend,
    titulo: 'Campanhas',
    nav: 'campanhas',
    legenda: 'Cada campanha já sai com o próprio atendimento.',
  },
  {
    id: 'contatos',
    rotulo: 'Contatos',
    Icon: IconUsers,
    titulo: 'Contatos',
    nav: 'contatos',
    legenda: 'Seus contatos organizados num lugar só.',
  },
]

// Cada tela vira um chunk próprio, baixado só quando a aba aparece pela primeira vez.
// Enquanto carrega, a janela já mostra a sidebar com o item certo ativo.
const casca = (nav: ItemNav, recolhida = false) =>
  function Carregando() {
    return <AppShell ativo={nav} recolhida={recolhida} />
  }

const TELAS: Record<AbaId, ComponentType<TelaProps>> = {
  fluxos: dynamic(() => import('./screens/FluxosScreen'), { ssr: false, loading: casca('automacao') }),
  atendimento: dynamic(() => import('./screens/AtendimentoScreen'), { ssr: false, loading: casca('mensagens', true) }),
  campanhas: dynamic(() => import('./screens/CampanhasScreen'), { ssr: false, loading: casca('campanhas') }),
  contatos: dynamic(() => import('./screens/ContatosScreen'), { ssr: false, loading: casca('contatos') }),
}

function useMovimentoReduzido() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

function useAbaDoNavegadorVisivel() {
  return useSyncExternalStore(
    (avisar) => {
      document.addEventListener('visibilitychange', avisar)
      return () => document.removeEventListener('visibilitychange', avisar)
    },
    () => document.visibilityState === 'visible',
    () => false,
  )
}

export function AppTour() {
  const [aba, setAba] = useState<AbaId>('fluxos')
  // Sem interação as abas se alternam; o primeiro clique fixa a escolhida em loop
  const [auto, setAuto] = useState(true)
  const [chave, setChave] = useState(0)
  const [perto, setPerto] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const reduzido = useMovimentoReduzido()
  const docVisivel = useAbaDoNavegadorVisivel()

  const raiz = useRef<HTMLDivElement>(null)
  const abas = useRef<Partial<Record<AbaId, HTMLButtonElement | null>>>({})

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    // Carrega a primeira tela um pouco antes de a seção aparecer
    const ioPerto = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPerto(true)
          ioPerto.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )
    // O roteiro só roda com a janela de fato na tela
    const ioVisivel = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.35 })
    ioPerto.observe(el)
    ioVisivel.observe(el)
    return () => {
      ioPerto.disconnect()
      ioVisivel.disconnect()
    }
  }, [])

  const aoTerminar = useCallback(() => {
    if (auto) {
      setAba((a) => ABAS[(ABAS.findIndex((x) => x.id === a) + 1) % ABAS.length].id)
    } else {
      setChave((c) => c + 1)
    }
  }, [auto])

  function escolher(id: AbaId) {
    setAuto(false)
    setAba(id)
    setChave((c) => c + 1)
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    const atual = ABAS.findIndex((a) => abas.current[a.id] === document.activeElement)
    if (atual < 0) return
    let alvo: number | null = null
    if (e.key === 'ArrowRight') alvo = (atual + 1) % ABAS.length
    if (e.key === 'ArrowLeft') alvo = (atual - 1 + ABAS.length) % ABAS.length
    if (e.key === 'Home') alvo = 0
    if (e.key === 'End') alvo = ABAS.length - 1
    if (alvo === null) return
    e.preventDefault()
    abas.current[ABAS[alvo].id]?.focus()
  }

  const atual = ABAS.find((a) => a.id === aba)!
  const Tela = TELAS[aba]

  return (
    <section id="por-dentro" aria-labelledby="por-dentro-titulo" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-[1168px] px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-[40rem]">
          <h2
            id="por-dentro-titulo"
            className="text-[2rem] leading-[1.15] font-normal tracking-[-0.02em] text-fg-strong sm:text-[2.5rem]"
          >
            Por dentro do Senderix
          </h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-muted">
            Um sistema feito para quem atende o dia todo. Veja como é usar.
          </p>
        </div>

        <div className="-mx-4 mt-10 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            role="tablist"
            aria-label="Telas do Senderix"
            onKeyDown={teclado}
            className="inline-flex rounded-md border border-line p-0.5"
          >
            {ABAS.map(({ id, rotulo, Icon }) => {
              const ativa = id === aba
              return (
                <button
                  key={id}
                  ref={(el) => {
                    abas.current[id] = el
                  }}
                  type="button"
                  role="tab"
                  id={`tela-aba-${id}`}
                  aria-selected={ativa}
                  aria-controls="tela-painel"
                  tabIndex={ativa ? 0 : -1}
                  onClick={() => escolher(id)}
                  className={`flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    ativa ? 'bg-subtle text-fg-strong' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Icon size={15} stroke={1.75} aria-hidden="true" />
                  {rotulo}
                </button>
              )
            })}
          </div>
        </div>

        <div role="tabpanel" id="tela-painel" aria-labelledby={`tela-aba-${aba}`} className="mt-4">
          <div ref={raiz}>
            <AppWindow titulo={atual.titulo}>
              {perto && (
                <div key={aba} className="fade-in h-full">
                  <Tela
                    ativo={visivel && docVisivel && !reduzido}
                    chave={chave}
                    estatico={reduzido}
                    aoTerminar={aoTerminar}
                  />
                </div>
              )}
            </AppWindow>
          </div>
          <p key={aba} className="fade-in mt-4 text-center text-[15px] leading-6 text-muted">
            {atual.legenda}
          </p>
        </div>
      </div>
    </section>
  )
}
