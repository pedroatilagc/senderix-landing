'use client'

import './confirmacao.css'
import { IconCheck, IconClock } from '@tabler/icons-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { WHATSAPP_CONTATO } from '@/config/site'
import type { RespostaConfirmacao } from '@/lib/confirmacao'

export type DadosModal = RespostaConfirmacao & { status: 'pago' | 'pendente' }

export type PropsModal = {
  dados: DadosModal
  /** Chamado depois da animação de saída */
  onFechado: () => void
}

const LINK_WHATSAPP = `${WHATSAPP_CONTATO}?text=${encodeURIComponent('Olá! Acabei de assinar o Senderix.')}`

const SAIDA_MS = 150

// Azuis da marca, branco e um cinza claro: comemoração sóbria, sem arco-íris
const CORES_CONFETE = ['#2563eb', '#3b82f6', '#93c5fd', '#ffffff', '#e2e8f0']

const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const PASSOS = [
  { titulo: 'Pagamento confirmado', texto: 'Concluído.', feito: true },
  {
    titulo: 'Vamos te chamar no WhatsApp',
    texto: 'Em breve alguém da Senderix entra em contato pelo número que você informou.',
    feito: false,
  },
  {
    titulo: 'Instalação do seu ambiente',
    texto: 'Você recebe o link de instalação e a gente te acompanha na configuração.',
    feito: false,
  },
]

const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useConfete(ativo: boolean, canvas: React.RefObject<HTMLCanvasElement | null>, dialogo: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!ativo || reduzMovimento()) return
    let cancelado = false
    let parar: (() => void) | undefined

    // Espera o modal assentar para a explosão sair da borda de cima dele
    const timer = window.setTimeout(async () => {
      const { default: confetti } = await import('canvas-confetti')
      if (cancelado || !canvas.current || !dialogo.current) return
      const disparar = confetti.create(canvas.current, { resize: true, disableForReducedMotion: true })
      parar = () => disparar.reset()

      const caixa = dialogo.current.getBoundingClientRect()
      const x = (caixa.left + caixa.width / 2) / window.innerWidth
      const y = (caixa.top + 24) / window.innerHeight
      const base = {
        particleCount: 34,
        spread: 52,
        startVelocity: 30,
        gravity: 1.15,
        decay: 0.9,
        ticks: 90,
        scalar: 0.72,
        colors: CORES_CONFETE,
        shapes: ['square', 'circle'] as confetti.Shape[],
      }
      disparar({ ...base, angle: 118, origin: { x: x - 0.04, y } })
      disparar({ ...base, angle: 62, origin: { x: x + 0.04, y } })
    }, 160)

    return () => {
      cancelado = true
      window.clearTimeout(timer)
      parar?.()
    }
  }, [ativo, canvas, dialogo])
}

export function ModalConfirmacao({ dados, onFechado }: PropsModal) {
  const raiz = useRef<HTMLDivElement>(null)
  const dialogo = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [saindo, setSaindo] = useState(false)
  const idTitulo = useId()
  const idTexto = useId()
  const pago = dados.status === 'pago'

  useConfete(pago, canvas, dialogo)

  const fechando = useRef(false)
  const fechar = useCallback(() => {
    if (fechando.current) return
    fechando.current = true
    setSaindo(true)
    window.setTimeout(onFechado, reduzMovimento() ? 0 : SAIDA_MS)
  }, [onFechado])

  // Trava o scroll, deixa o resto da página inerte e prende o foco no modal
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const barra = window.innerWidth - html.clientWidth
    const antes = { overflow: html.style.overflow, paddingRight: body.style.paddingRight }
    html.style.overflow = 'hidden'
    if (barra > 0) body.style.paddingRight = `${barra}px`

    const inertes = Array.from(body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== raiz.current && !el.inert,
    )
    inertes.forEach((el) => (el.inert = true))

    dialogo.current?.focus()

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        fechar()
        return
      }
      if (e.key !== 'Tab' || !dialogo.current) return
      const focaveis = Array.from(dialogo.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL))
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const atual = document.activeElement
      if (e.shiftKey && (atual === primeiro || atual === dialogo.current)) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (atual === ultimo || !dialogo.current.contains(atual))) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      inertes.forEach((el) => (el.inert = false))
      html.style.overflow = antes.overflow
      body.style.paddingRight = antes.paddingRight
      // Foco volta para o body
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    }
  }, [fechar])

  const nome = dados.primeiroNome

  return createPortal(
    <div ref={raiz} className="confirmacao" data-saindo={saindo}>
      <div className="confirmacao-veu" aria-hidden="true" />
      <div
        className="confirmacao-centro"
        onClick={(e) => {
          if (e.target === e.currentTarget) fechar()
        }}
      >
        <div
          ref={dialogo}
          role="dialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          aria-describedby={idTexto}
          tabIndex={-1}
          className="confirmacao-dialogo w-full max-w-[440px] rounded-xl border border-line p-7 sm:p-8"
        >
          <span className="confirmacao-icone flex size-11 items-center justify-center rounded-full border-[1.5px] border-accent-text text-accent-text">
            {pago ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  className="confirmacao-check"
                  d="M5 12.5l4.5 4.5L19 7.5"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <IconClock size={21} stroke={1.5} aria-hidden="true" />
            )}
          </span>

          <h2
            id={idTitulo}
            className="mt-5 text-[1.5rem] leading-[1.2] font-normal tracking-[-0.02em] text-balance text-fg-strong"
          >
            {pago
              ? nome
                ? `Tudo certo, ${nome}.`
                : 'Pagamento confirmado.'
              : nome
                ? `Recebemos seu pedido, ${nome}.`
                : 'Recebemos seu pedido.'}
          </h2>

          <p id={idTexto} className="mt-2 text-[15px] leading-[1.55] text-muted">
            {pago ? (
              dados.plano ? (
                <>
                  Sua assinatura do plano <strong className="font-medium text-fg-strong">{dados.plano}</strong> está
                  ativa.
                </>
              ) : (
                'Sua assinatura está ativa.'
              )
            ) : (
              'Assim que o pagamento for confirmado, alguém da Senderix entra em contato pelo WhatsApp.'
            )}
          </p>

          {pago && (
            <div className="mt-7 border-t border-line pt-6">
              <h3 className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Próximos passos</h3>
              <ol className="mt-4">
                {PASSOS.map((passo, i) => (
                  <li key={passo.titulo} className="relative pb-5 pl-8 last:pb-0">
                    {i < PASSOS.length - 1 && (
                      <span aria-hidden="true" className="absolute top-6 bottom-1 left-[9.5px] w-px bg-line-strong" />
                    )}
                    {passo.feito ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-0 flex size-5 items-center justify-center rounded-full bg-accent text-on-accent"
                      >
                        <IconCheck size={12} stroke={3} />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="confirmacao-passo-vazio absolute top-0 left-0 size-5 rounded-full border-[1.5px] border-line-strong"
                      />
                    )}
                    <p className="text-[15px] leading-5 font-medium text-fg-strong">{passo.titulo}</p>
                    <p className="mt-1 text-[14px] leading-[1.5] text-muted">{passo.texto}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <a
              href={LINK_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a gente agora no WhatsApp (abre em nova aba)"
              className="btn btn-primary sm:flex-1"
            >
              Falar com a gente agora
            </a>
            <button type="button" onClick={fechar} className="btn btn-outline">
              Fechar
            </button>
          </div>

          {pago && <p className="mt-5 text-[13px] leading-[1.5] text-muted">Você também recebe o recibo por e-mail.</p>}
        </div>
      </div>
      <canvas ref={canvas} aria-hidden="true" className="confirmacao-confete" />
    </div>,
    document.body,
  )
}
