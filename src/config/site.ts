// Fonte única de verdade: preços, limites e links. Nenhum componente deve
// repetir estes valores.

export const SITE = {
  nome: 'Senderix',
  titulo: 'Senderix',
  descricao:
    'Automatize o atendimento no WhatsApp com menus, respostas automáticas e transferência para atendente. Dispare campanhas com fluxo próprio. Veja os planos.',
  url: 'https://senderix.com.br', // TODO: confirmar domínio final
}

// Link curto do WhatsApp usado em todos os "Falar com a gente"
export const WHATSAPP_LINK = 'https://w.app/senderix'

export const RECURSOS_BASE = [
  'Fluxos com menus e respostas automáticas',
  'Boas-vindas automática e por palavra-chave',
  'Transferência para atendente humano',
  'Campanhas com fluxo de resposta próprio',
  'Lista de contatos e relatórios',
  'Suporte humano, do jeito que você precisar',
  'Ajuda para montar os seus fluxos',
] as const

export type Plano = {
  id: string
  nome: string
  /** null = sob consulta */
  preco: number | null
  numeros: number | string
  /** null = ilimitado */
  fluxos: number | null
  /** Computadores com o Senderix ativado ao mesmo tempo; null = sob medida */
  computadores: number | null
  /** null = usa WHATSAPP_LINK */
  checkout: string | null
  destaque: boolean
  /** Rótulo pequeno ao lado do nome do plano */
  selo: string | null
  frase: string
  cta: string
  extras: string[]
}

export const PLANOS: Plano[] = [
  {
    id: 'silver',
    nome: 'Silver',
    preco: 339.9,
    numeros: 1,
    fluxos: 3,
    computadores: 2,
    checkout: 'TODO_LINK_ABACATEPAY_SILVER',
    destaque: false,
    selo: null,
    frase: 'Automatize sua recepção e suas principais campanhas',
    cta: 'Assinar Silver',
    extras: [],
  },
  {
    id: 'gold',
    nome: 'Gold',
    preco: 549.9,
    numeros: 3,
    fluxos: 10,
    computadores: 4,
    checkout: 'TODO_LINK_ABACATEPAY_GOLD',
    destaque: true,
    selo: 'Recomendado',
    frase: 'Cada campanha com o próprio atendimento automático',
    cta: 'Assinar Gold',
    extras: ['Separe o número de atendimento do número de campanhas'],
  },
  {
    id: 'platinum',
    nome: 'Platinum',
    preco: 719.9,
    numeros: 5,
    fluxos: null,
    computadores: 8,
    checkout: 'TODO_LINK_ABACATEPAY_PLATINUM',
    destaque: false,
    selo: null,
    frase: 'Toda a sua operação no WhatsApp no piloto automático',
    cta: 'Assinar Platinum',
    extras: [
      'Separe o número de atendimento do número de campanhas',
      'Números reserva para não parar se um for restringido',
    ],
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: null,
    numeros: '6 ou mais',
    fluxos: null,
    computadores: null,
    checkout: null,
    destaque: false,
    selo: 'Para grandes operações',
    frase: 'Para operações com muitos números e atendimento próximo',
    cta: 'Falar com a gente',
    extras: ['Implantação feita por nós', 'Faturamento flexível'],
  },
]

export const isPendente = (link: string) => link.startsWith('TODO')
