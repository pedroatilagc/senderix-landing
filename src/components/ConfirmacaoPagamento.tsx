'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { RespostaConfirmacao } from '@/lib/confirmacao'
import type { EstadoModal, PropsModal } from './confirmacao/ModalConfirmacao'

// Volta do Link de pagamento da Stripe (/?session_id=cs_...). Sem o parâmetro
// este componente não faz nada. Com ele, o modal abre na hora em "verificando"
// enquanto a rota consulta a Stripe; o nome nunca vem da URL.

type Resultado = { status: 'pago' | 'pendente'; dados: RespostaConfirmacao } | null

/** Passado disso, troca para a variante neutra em vez de seguir verificando */
const LIMITE_MS = 8000

async function consultar(id: string): Promise<Resultado> {
  try {
    const res = await fetch(`/api/checkout-session?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const dados = (await res.json()) as RespostaConfirmacao
    return dados.status === 'pago' || dados.status === 'pendente' ? { status: dados.status, dados } : null
  } catch {
    return null
  }
}

// Só em desenvolvimento: /?preview_confirmacao=verificando|pago|pendente|neutro|invalido, sem chamar a Stripe.
// pago, pendente e invalido passam 1,2 s em "verificando" para dar para ver a troca.
function simular(preview: string): { resultado: Promise<Resultado>; limiteMs?: number | null } {
  const ficticio: RespostaConfirmacao = { status: 'pago', primeiroNome: 'Ana', plano: 'Gold' }
  const depois = (r: Resultado) => new Promise<Resultado>((ok) => setTimeout(() => ok(r), 1200))
  switch (preview) {
    case 'pago':
      return { resultado: depois({ status: 'pago', dados: ficticio }) }
    case 'pendente':
      return { resultado: depois({ status: 'pendente', dados: { ...ficticio, status: 'pendente' } }) }
    case 'invalido':
      return { resultado: depois(null) }
    case 'neutro':
      return { resultado: new Promise(() => {}), limiteMs: 0 }
    default:
      return { resultado: new Promise(() => {}), limiteMs: null }
  }
}

export function ConfirmacaoPagamento() {
  const [Modal, setModal] = useState<ComponentType<PropsModal> | null>(null)
  const [estado, setEstado] = useState<EstadoModal>('verificando')
  const [dados, setDados] = useState<RespostaConfirmacao | null>(null)
  const [fechado, setFechado] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const preview = process.env.NODE_ENV !== 'production' ? params.get('preview_confirmacao') : null
    if (!sessionId && !preview) return

    // Tira o id da barra de endereço antes de tudo: não reabre ao atualizar nem vai junto num link copiado
    params.delete('session_id')
    params.delete('preview_confirmacao')
    const resto = params.toString()
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${resto ? `?${resto}` : ''}${window.location.hash}`,
    )

    // A consulta sai primeiro; os chunks do modal e do confete descem em paralelo com ela.
    // O modal abre assim que o próprio chunk chega, sem esperar a resposta.
    // Sem cleanup de cancelamento: no StrictMode a segunda execução já não acha o
    // parâmetro, então cancelar aqui faria a primeira (e única) consulta se perder.
    const sim = preview ? simular(preview) : null
    const resultado = sim ? sim.resultado : consultar(sessionId!)
    const chunkModal = import('./confirmacao/ModalConfirmacao')
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) import('canvas-confetti').catch(() => {})

    let atual: EstadoModal = 'verificando'
    const definir = (novo: EstadoModal) => {
      atual = novo
      setEstado(novo)
    }

    const limiteMs = sim?.limiteMs === undefined ? LIMITE_MS : sim.limiteMs
    const limite =
      limiteMs === null
        ? undefined
        : window.setTimeout(() => {
            if (atual === 'verificando') definir('neutro')
          }, limiteMs)

    resultado.then((r) => {
      window.clearTimeout(limite)
      if (r) {
        // Resposta atrasada que chega depois da neutra ainda vira sucesso/pendente
        setDados(r.dados)
        definir(r.status)
      } else if (atual === 'verificando') {
        definir('invalido')
      }
    })

    chunkModal
      .then(({ ModalConfirmacao }) => {
        // Inválido antes do modal chegar: nunca chega a abrir
        if (atual === 'invalido') setFechado(true)
        else setModal(() => ModalConfirmacao)
      })
      .catch(() => {})
  }, [])

  if (!Modal || fechado) return null
  return <Modal estado={estado} dados={dados} onFechado={() => setFechado(true)} />
}
