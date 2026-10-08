// Contrato entre /api/checkout-session e o modal de confirmação

export type StatusConfirmacao = 'pago' | 'pendente' | 'invalido'

export type RespostaConfirmacao = {
  status: StatusConfirmacao
  primeiroNome: string | null
  plano: string | null
}
