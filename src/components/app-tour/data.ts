// Dados fictícios de todas as telas da demonstração. Nenhum nome, número ou
// mensagem vem do app ou de clientes reais: tudo foi inventado aqui.
// Os números aparecem sempre mascarados, no formato que cada tela do app usa.

export type AbaId = 'fluxos' | 'atendimento' | 'campanhas' | 'contatos'

// Empresa fictícia que "usa" o Senderix na demonstração
export const EMPRESA = 'Studio Navalha'

// +55 (85) 9••••-1234, formato das telas de Mensagens e Contatos
export const fone = (ddd: string, fim: string) => `+55 (${ddd}) 9••••-${fim}`
// 55859••••1234, formato cru das tabelas de Campanhas e dos cartões de instância
export const foneCru = (ddd: string, fim: string) => `55${ddd}9••••${fim}`

// ─── Fluxos ──────────────────────────────────────────────────────────────────

export const FLUXO_NOME = 'Recepção'

export const FLUXO_TEXTO_NOVO = 'Perfeito, {{nome}}! Topa uma conversa rápida?'
export const FLUXO_BOTOES_NOVOS = ['Sim, bora!', 'Prefiro por aqui']

// ─── Atendimento (tela Mensagens) ────────────────────────────────────────────

export type Mensagem = {
  id: number
  nome: string
  numero: string
  dispositivo: string
  mensagem: string | null
  recebido: string
  /** Pedido de atendimento em aberto */
  aguardando?: boolean
}

export const MENSAGENS: Mensagem[] = [
  { id: 4, nome: 'Carlos Menezes', numero: fone('85', '3307'), dispositivo: 'Recepção', mensagem: 'Abrem no feriado?', recebido: 'há 3min' },
  { id: 3, nome: 'Juliana Prado', numero: fone('85', '7712'), dispositivo: 'Recepção', mensagem: 'Ótimo, obrigada!', recebido: 'há 12min' },
  { id: 2, nome: 'Rafael Torres', numero: fone('88', '1946'), dispositivo: 'Campanhas 1', mensagem: 'Quanto é o corte?', recebido: 'há 25min' },
  { id: 1, nome: 'Bruna Lima', numero: fone('85', '6258'), dispositivo: 'Recepção', mensagem: null, recebido: 'há 1h' },
]

export const MENSAGEM_NOVA: Mensagem = {
  id: 5,
  nome: 'Ana Ribeiro',
  numero: fone('85', '4821'),
  dispositivo: 'Recepção',
  mensagem: 'Dá pra remarcar?',
  recebido: 'agora',
  aguardando: true,
}

// ─── Campanhas ───────────────────────────────────────────────────────────────

export type ContatoCampanha = { nome: string; numero: string }

// A base tem 118 contatos; só os primeiros aparecem nas tabelas (o resto fica
// abaixo da rolagem, como no app)
export const TOTAL_CONTATOS_CAMPANHA = 118

export const CONTATOS_CAMPANHA: ContatoCampanha[] = [
  { nome: 'Ana Ribeiro', numero: foneCru('85', '4821') },
  { nome: 'Bruna Lima', numero: foneCru('85', '6258') },
  { nome: 'Carlos Menezes', numero: foneCru('85', '3307') },
  { nome: 'Daniela Freitas', numero: foneCru('85', '5190') },
  { nome: 'Eduardo Sales', numero: foneCru('88', '2264') },
  { nome: 'Fernanda Rocha', numero: foneCru('85', '8035') },
  { nome: 'Gustavo Pinheiro', numero: foneCru('85', '1472') },
  { nome: 'Helena Martins', numero: foneCru('85', '9613') },
]

export const FLUXOS_CAMPANHA = [
  { id: 1, nome: 'Recepção', blocos: 5 },
  { id: 2, nome: 'Resposta da campanha', blocos: 4 },
]
export const FLUXO_CAMPANHA_ID = 2

// Primeiro bloco do fluxo "Resposta da campanha" (um menu com botões)
export const FLUXO_CAMPANHA_TEXTO =
  'Oi, {{nome}}! É a Semana do Cliente no Studio Navalha: *20% em todos os serviços* até sábado. Vamos agendar?'
export const FLUXO_CAMPANHA_BOTOES = ['Quero aproveitar', 'Falar com atendente', 'Não tenho interesse']

export type Instancia = { id: number; nome: string; numero: string }

export const INSTANCIAS: Instancia[] = [
  { id: 1, nome: 'Recepção', numero: foneCru('85', '1234') },
  { id: 2, nome: 'Campanhas 1', numero: foneCru('85', '5678') },
  { id: 3, nome: 'Campanhas 2', numero: foneCru('85', '9012') },
]
export const INSTANCIAS_CAMPANHA = [2, 3]

export const CAMPANHA_NOME = 'Semana do cliente'

// Horários de envio exibidos na tabela de progresso (formato toLocaleString pt-BR)
export const HORARIOS_ENVIO = [
  '05/10/2026, 14:32:04',
  '05/10/2026, 14:32:17',
  '05/10/2026, 14:32:29',
  '05/10/2026, 14:32:44',
  '05/10/2026, 14:32:58',
  '05/10/2026, 14:33:09',
  '05/10/2026, 14:33:23',
  '05/10/2026, 14:33:36',
]

// ─── Contatos ────────────────────────────────────────────────────────────────

export type Contato = { id: number; nome: string; numero: string; optOut: boolean }

export const CONTATOS: Contato[] = [
  { id: 1, nome: 'Ana Ribeiro', numero: fone('85', '4821'), optOut: false },
  { id: 2, nome: 'Bruna Lima', numero: fone('85', '6258'), optOut: false },
  { id: 3, nome: 'Carlos Menezes', numero: fone('85', '3307'), optOut: false },
  { id: 4, nome: 'Felipe Andrade', numero: fone('85', '2089'), optOut: true },
  { id: 5, nome: 'Juliana Prado', numero: fone('85', '7712'), optOut: false },
  { id: 6, nome: 'Marcos Vieira', numero: fone('88', '5531'), optOut: false },
  { id: 7, nome: 'Mariana Costa', numero: fone('85', '9047'), optOut: false },
  { id: 8, nome: 'Pedro Amaral', numero: fone('85', '3618'), optOut: false },
  { id: 9, nome: 'Rafael Torres', numero: fone('88', '1946'), optOut: false },
  { id: 10, nome: 'Tamara Nogueira', numero: fone('85', '8274'), optOut: false },
]

export const BUSCA_CONTATOS = 'mar'
// Contato que recebe o opt-out no fim do roteiro
export const CONTATO_OPT_OUT = 2
