'use client'

import './confirmacao.css'
import { IconCheck, IconClock, IconMail } from '@tabler/icons-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WHATSAPP_CONTATO } from '@/config/site'
import type { RespostaConfirmacao } from '@/lib/confirmacao'

/**
 * verificando: aberto na hora, enquanto a rota consulta a Stripe
 * neutro: a rota demorou demais; nunca deixar o cliente preso no "verificando"
 * invalido: fecha suavemente, sem mensagem
 */
export type EstadoModal = 'verificando' | 'pago' | 'pendente' | 'neutro' | 'invalido'

type Conteudo = Exclude<EstadoModal, 'invalido'>

export type PropsModal = {
  estado: EstadoModal
  /** Sempre da resposta da rota, nunca da URL */
  dados: RespostaConfirmacao | null
  /** Chamado depois da animação de saída */
  onFechado: () => void
}

const LINK_WHATSAPP = `${WHATSAPP_CONTATO}?text=${encodeURIComponent('Olá! Acabei de assinar o Senderix.')}`

const SAIDA_MS = 150
const TROCA_MS = 200

// Azuis da marca, branco e um cinza claro: comemoração sóbria, sem arco-íris
const CORES_CONFETE = ['#2563eb', '#3b82f6', '#93c5fd', '#ffffff', '#e2e8f0']

// Elementos do conteúdo que está saindo ficam inertes e fora do ciclo do Tab
const SELETOR_FOCAVEL =
  'a[href]:not([inert] *), button:not([disabled]):not([inert] *), [tabindex]:not([tabindex="-1"]):not([inert] *)'

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

type Textos = { titulo: string; texto: string; partes?: [string, string, string] }

function textos(tipo: Conteudo, dados: RespostaConfirmacao | null): Textos {
  const nome = dados?.primeiroNome
  switch (tipo) {
    case 'verificando':
      return { titulo: 'Confirmando seu pagamento…', texto: 'Só um instante.' }
    case 'pago':
      return {
        titulo: nome ? `Tudo certo, ${nome}.` : 'Pagamento confirmado.',
        texto: dados?.plano ? `Sua assinatura do plano ${dados.plano} está ativa.` : 'Sua assinatura está ativa.',
        partes: dados?.plano ? ['Sua assinatura do plano ', dados.plano, ' está ativa.'] : undefined,
      }
    case 'pendente':
      return {
        titulo: nome ? `Recebemos seu pedido, ${nome}.` : 'Recebemos seu pedido.',
        texto: 'Assim que o pagamento for confirmado, alguém da Senderix entra em contato pelo WhatsApp.',
      }
    case 'neutro':
      return {
        titulo: 'Recebemos seu retorno.',
        texto:
          'Se o pagamento foi concluído, você recebe a confirmação por e-mail e entraremos em contato pelo WhatsApp.',
      }
  }
}

function Texto({ texto, partes }: Pick<Textos, 'texto' | 'partes'>) {
  if (!partes) return texto
  const [antes, destaque, depois] = partes
  return (
    <>
      {antes}
      <strong className="font-medium text-fg-strong">{destaque}</strong>
      {depois}
    </>
  )
}

function Icone({ tipo }: { tipo: Conteudo }) {
  if (tipo === 'verificando') {
    // Anel fino girando sobre a borda do círculo
    return (
      <svg className="confirmacao-giro" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r="21.25" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="34 200" />
      </svg>
    )
  }
  let icone: ReactNode
  if (tipo === 'pago') {
    icone = (
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
    )
  } else if (tipo === 'pendente') {
    icone = <IconClock size={21} stroke={1.5} aria-hidden="true" />
  } else {
    icone = <IconMail size={20} stroke={1.5} aria-hidden="true" />
  }
  return (
    <span key={tipo} className="confirmacao-icone-novo flex">
      {icone}
    </span>
  )
}

function Corpo({
  tipo,
  dados,
  idTitulo,
  idTexto,
  fechar,
}: {
  tipo: Conteudo
  dados: RespostaConfirmacao | null
  idTitulo?: string
  idTexto?: string
  fechar: () => void
}) {
  const { titulo, texto, partes } = textos(tipo, dados)
  return (
    <>
      <h2 id={idTitulo} className="text-[1.5rem] leading-[1.2] font-normal tracking-[-0.02em] text-balance text-fg-strong">
        {titulo}
      </h2>
      <p id={idTexto} className="mt-2 text-[15px] leading-[1.55] text-muted">
        <Texto texto={texto} partes={partes} />
      </p>

      {tipo === 'pago' && (
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

      {tipo !== 'verificando' && (
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={LINK_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${tipo === 'neutro' ? 'Falar com a gente' : 'Falar com a gente agora'} no WhatsApp (abre em nova aba)`}
            className="btn btn-primary sm:flex-1"
          >
            {tipo === 'neutro' ? 'Falar com a gente' : 'Falar com a gente agora'}
          </a>
          <button type="button" onClick={fechar} className="btn btn-outline">
            Fechar
          </button>
        </div>
      )}

      {tipo === 'pago' && <p className="mt-5 text-[13px] leading-[1.5] text-muted">Você também recebe o recibo por e-mail.</p>}
    </>
  )
}

function useConfete(ativo: boolean, canvas: React.RefObject<HTMLCanvasElement | null>, dialogo: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!ativo || reduzMovimento()) return
    let cancelado = false
    let parar: (() => void) | undefined

    // Espera a troca de conteúdo e o modal crescer, para a explosão sair da borda de cima dele.
    // O chunk já foi pedido pelo ConfirmacaoPagamento junto com a consulta; aqui só reaproveita.
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
    }, 280)

    return () => {
      cancelado = true
      window.clearTimeout(timer)
      parar?.()
    }
  }, [ativo, canvas, dialogo])
}

export function ModalConfirmacao({ estado, dados, onFechado }: PropsModal) {
  const raiz = useRef<HTMLDivElement>(null)
  const dialogo = useRef<HTMLDivElement>(null)
  const moldura = useRef<HTMLDivElement>(null)
  const conteudo = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [saindo, setSaindo] = useState(false)
  const idTitulo = useId()
  const idTexto = useId()

  // "invalido" não tem tela própria: mantém o que está na tela enquanto fecha
  const [exibido, setExibido] = useState<Conteudo>(estado === 'invalido' ? 'verificando' : estado)
  const [anterior, setAnterior] = useState<Conteudo | null>(null)
  if (estado !== 'invalido' && estado !== exibido) {
    setAnterior(exibido)
    setExibido(estado)
  }

  useConfete(exibido === 'pago', canvas, dialogo)

  const fechando = useRef(false)
  const fechar = useCallback(() => {
    if (fechando.current) return
    fechando.current = true
    setSaindo(true)
    window.setTimeout(onFechado, reduzMovimento() ? 0 : SAIDA_MS)
  }, [onFechado])

  useEffect(() => {
    if (estado === 'invalido') fechar()
  }, [estado, fechar])

  // O conteúdo que saiu fica por cima, sumindo, só durante o crossfade
  useEffect(() => {
    if (!anterior) return
    const timer = window.setTimeout(() => setAnterior(null), TROCA_MS)
    return () => window.clearTimeout(timer)
  }, [anterior])

  // A moldura acompanha a altura do conteúdo com transição, sem salto quando ele cresce
  useLayoutEffect(() => {
    const el = conteudo.current
    const caixa = moldura.current
    if (!el || !caixa) return
    const medir = () => {
      caixa.style.height = `${el.offsetHeight + parseFloat(getComputedStyle(caixa).paddingBottom)}px`
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [exibido])

  // Se o foco estava num elemento que saiu na troca, devolve ao diálogo
  useEffect(() => {
    const d = dialogo.current
    if (d && (!d.contains(document.activeElement) || document.activeElement?.closest('[inert]'))) d.focus()
  }, [exibido])

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
      if (focaveis.length === 0) {
        e.preventDefault()
        return
      }
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

  const verificando = exibido === 'verificando'
  const atual = textos(exibido, dados)

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
          {/* Anuncia o resultado quando a verificação termina; ocupado enquanto verifica */}
          <p className="sr-only" aria-live="polite" aria-busy={verificando}>
            {verificando ? '' : `${atual.titulo} ${atual.texto}`}
          </p>

          <span className="confirmacao-icone" data-estado={exibido}>
            <Icone tipo={exibido} />
          </span>

          <div ref={moldura} className="confirmacao-moldura">
            <div ref={conteudo} key={exibido} className={anterior ? 'confirmacao-entrando' : undefined}>
              <Corpo tipo={exibido} dados={dados} idTitulo={idTitulo} idTexto={idTexto} fechar={fechar} />
            </div>
            {anterior && (
              <div key={`saindo-${anterior}`} className="confirmacao-saindo" inert aria-hidden="true">
                <Corpo tipo={anterior} dados={dados} fechar={fechar} />
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvas} aria-hidden="true" className="confirmacao-confete" />
    </div>,
    document.body,
  )
}
