'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { RespostaConfirmacao } from '@/lib/confirmacao'
import type { DadosModal, PropsModal } from './confirmacao/ModalConfirmacao'

// Volta do Link de pagamento da Stripe (/?session_id=cs_...). Sem o parâmetro
// este componente não faz nada: o modal e o confete só são baixados quando a
// rota confirma a sessão com a Stripe. O nome nunca vem da URL.

const PREVIEW: Record<string, DadosModal> = {
  pago: { status: 'pago', primeiroNome: 'Ana', plano: 'Gold' },
  pendente: { status: 'pendente', primeiroNome: 'Ana', plano: 'Gold' },
}

async function consultar(id: string): Promise<DadosModal | null> {
  try {
    const res = await fetch(`/api/checkout-session?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const dados = (await res.json()) as RespostaConfirmacao
    return dados.status === 'pago' || dados.status === 'pendente' ? (dados as DadosModal) : null
  } catch {
    return null
  }
}

export function ConfirmacaoPagamento() {
  const [aberto, setAberto] = useState<{ Modal: ComponentType<PropsModal>; dados: DadosModal } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    // Só em desenvolvimento: /?preview_confirmacao=pago|pendente, sem chamar a Stripe
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

    // Sem cleanup de cancelamento: no StrictMode a segunda execução já não acha o
    // parâmetro, então abortar aqui faria a primeira (e única) consulta se perder.
    ;(async () => {
      const dados = preview ? (PREVIEW[preview] ?? null) : await consultar(sessionId!)
      if (!dados) return
      const { ModalConfirmacao } = await import('./confirmacao/ModalConfirmacao')
      setAberto({ Modal: ModalConfirmacao, dados })
    })().catch(() => {})
  }, [])

  if (!aberto) return null
  const { Modal, dados } = aberto
  return <Modal dados={dados} onFechado={() => setAberto(null)} />
}
