import Stripe from 'stripe'
import type { RespostaConfirmacao, StatusConfirmacao } from '@/lib/confirmacao'

// Confirma uma sessão do Checkout da Stripe para o modal pós-pagamento.
// O id da sessão fica no histórico do navegador, então esta rota devolve só o
// mínimo para a tela: status, primeiro nome e plano. Nunca e-mail, telefone,
// endereço, valor ou ids.

const FORMATO_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/
const VALIDADE_SEGUNDOS = 24 * 60 * 60
const SEM_CACHE = { 'Cache-Control': 'no-store' }

const INVALIDO: RespostaConfirmacao = { status: 'invalido', primeiroNome: null, plano: null }

function responder(corpo: unknown, status = 200) {
  return Response.json(corpo, { status, headers: SEM_CACHE })
}

function primeiroNome(nome: string | null | undefined): string | null {
  const palavra = nome?.trim().split(/\s+/)[0]
  if (!palavra) return null
  const minusculo = palavra.slice(0, 40).toLocaleLowerCase('pt-BR')
  return minusculo.charAt(0).toLocaleUpperCase('pt-BR') + minusculo.slice(1)
}

function nomePlano(sessao: Stripe.Checkout.Session): string | null {
  const produto = sessao.line_items?.data[0]?.price?.product
  if (!produto || typeof produto === 'string' || produto.deleted) return null
  const nome = produto.name.replace(/^Senderix\s+/i, '').trim()
  return nome || null
}

function statusDa(sessao: Stripe.Checkout.Session): StatusConfirmacao {
  const idade = Date.now() / 1000 - sessao.created
  if (idade > VALIDADE_SEGUNDOS || sessao.status !== 'complete') return 'invalido'
  if (sessao.payment_status === 'paid' || sessao.payment_status === 'no_payment_required') return 'pago'
  if (sessao.payment_status === 'unpaid') return 'pendente'
  return 'invalido'
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !FORMATO_ID.test(id)) {
    return responder({ erro: 'Requisição inválida.' }, 400)
  }

  const chave = process.env.STRIPE_SECRET_KEY
  if (!chave) {
    console.warn('[checkout-session] STRIPE_SECRET_KEY não configurada')
    return responder({ erro: 'Erro interno.' }, 500)
  }

  try {
    const stripe = new Stripe(chave)
    const sessao = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items.data.price.product'],
    })

    const status = statusDa(sessao)
    if (status === 'invalido') return responder(INVALIDO)

    const resposta: RespostaConfirmacao = {
      status,
      primeiroNome: primeiroNome(sessao.customer_details?.name),
      plano: nomePlano(sessao),
    }
    return responder(resposta)
  } catch (erro) {
    // Só o tipo do erro: a mensagem da Stripe pode ecoar dados da requisição
    const tipo = erro instanceof Stripe.errors.StripeError ? erro.type : 'desconhecido'
    console.warn(`[checkout-session] falha ao consultar a Stripe (${tipo})`)
    return responder(INVALIDO)
  }
}
