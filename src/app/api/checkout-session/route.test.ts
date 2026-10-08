import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const retrieve = vi.fn()

vi.mock('stripe', () => {
  class StripeError extends Error {
    type = 'StripeInvalidRequestError'
  }
  class Stripe {
    static errors = { StripeError }
    checkout = { sessions: { retrieve } }
  }
  return { default: Stripe }
})

const { GET } = await import('./route')

const ID_VALIDO = 'cs_test_a1B2c3D4e5F6g7H8'
const agora = () => Math.floor(Date.now() / 1000)

function sessao(extra: Record<string, unknown> = {}) {
  return {
    id: ID_VALIDO,
    object: 'checkout.session',
    created: agora() - 60,
    status: 'complete',
    payment_status: 'paid',
    amount_total: 54990,
    customer: 'cus_123',
    customer_email: 'ana@exemplo.com',
    customer_details: {
      name: 'ANA maria souza',
      email: 'ana@exemplo.com',
      phone: '+5511999998888',
      address: { city: 'São Paulo', line1: 'Rua X, 10' },
    },
    line_items: {
      data: [{ price: { product: { id: 'prod_1', name: 'Senderix Gold', deleted: undefined } } }],
    },
    ...extra,
  }
}

const chamar = (id: string | null = ID_VALIDO) =>
  GET(new Request(`http://localhost/api/checkout-session${id === null ? '' : `?id=${encodeURIComponent(id)}`}`))

beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'rk_test_chave')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  retrieve.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('GET /api/checkout-session', () => {
  it.each([null, '', 'qualquer_coisa', 'cs_test_curto', 'cs_prod_a1B2c3D4e5F6', `cs_live_${'a'.repeat(201)}`, 'cs_test_a1B2c3D4e5F6;drop'])(
    'responde 400 para id inválido (%s) sem chamar a Stripe',
    async (id) => {
      const res = await chamar(id)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ erro: 'Requisição inválida.' })
      expect(retrieve).not.toHaveBeenCalled()
    },
  )

  it('sessão paga → pago, com primeiro nome e plano', async () => {
    retrieve.mockResolvedValue(sessao())
    const res = await chamar()
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ status: 'pago', primeiroNome: 'Ana', plano: 'Gold' })
    expect(retrieve).toHaveBeenCalledWith(ID_VALIDO, { expand: ['line_items.data.price.product'] })
  })

  it('no_payment_required também conta como pago', async () => {
    retrieve.mockResolvedValue(sessao({ payment_status: 'no_payment_required' }))
    expect((await (await chamar()).json()).status).toBe('pago')
  })

  it('sessão unpaid → pendente', async () => {
    retrieve.mockResolvedValue(sessao({ payment_status: 'unpaid' }))
    expect(await (await chamar()).json()).toEqual({ status: 'pendente', primeiroNome: 'Ana', plano: 'Gold' })
  })

  it.each(['open', 'expired'])('sessão %s → invalido', async (status) => {
    retrieve.mockResolvedValue(sessao({ status, payment_status: 'unpaid' }))
    expect(await (await chamar()).json()).toEqual({ status: 'invalido', primeiroNome: null, plano: null })
  })

  it('sessão com mais de 24h → invalido', async () => {
    retrieve.mockResolvedValue(sessao({ created: agora() - 24 * 60 * 60 - 1 }))
    expect(await (await chamar()).json()).toEqual({ status: 'invalido', primeiroNome: null, plano: null })
  })

  it('sem nome nem produto expandido → nulls', async () => {
    retrieve.mockResolvedValue(sessao({ customer_details: { name: '  ' }, line_items: { data: [{ price: { product: 'prod_1' } }] } }))
    expect(await (await chamar()).json()).toEqual({ status: 'pago', primeiroNome: null, plano: null })
  })

  it('erro da Stripe → invalido, sem repassar a mensagem', async () => {
    retrieve.mockRejectedValue(new Error('No such checkout.session: cs_test_... (ana@exemplo.com)'))
    const res = await chamar()
    expect(res.status).toBe(200)
    const texto = await res.text()
    expect(JSON.parse(texto)).toEqual({ status: 'invalido', primeiroNome: null, plano: null })
    expect(texto).not.toContain('No such')
    expect(String(vi.mocked(console.warn).mock.calls)).not.toContain('ana@exemplo.com')
  })

  it('a resposta nunca contém e-mail, telefone, endereço, valor ou ids', async () => {
    for (const payment_status of ['paid', 'unpaid']) {
      retrieve.mockResolvedValue(sessao({ payment_status }))
      const texto = await (await chamar()).text()
      expect(Object.keys(JSON.parse(texto)).sort()).toEqual(['plano', 'primeiroNome', 'status'])
      for (const proibido of ['ana@exemplo.com', '@', '5511999998888', 'Rua X', 'São Paulo', '54990', 'cus_123', ID_VALIDO, 'souza']) {
        expect(texto).not.toContain(proibido)
      }
    }
  })

  it('sem STRIPE_SECRET_KEY → 500 genérico', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    const res = await chamar()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ erro: 'Erro interno.' })
    expect(retrieve).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })
})
