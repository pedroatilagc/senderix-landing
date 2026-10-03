import {
  IconCalendar,
  IconCircleX,
  IconClock,
  IconHeadset,
  IconListDetails,
  IconMessage,
  IconMoodSmile,
  IconSpeakerphone,
  type Icon,
} from '@tabler/icons-react'

/*
 * Dados dos cenários da ilustração do hero. O componente só renderiza o que
 * está aqui: conversa, nós, linhas e a linha do tempo (fase → o que acende).
 *
 * Fases: cada roteiro avança de 0 (vazio) até a última fase de `passos`.
 * Um elemento com `de: n` aparece a partir da fase n. Sem JS ou com
 * prefers-reduced-motion, a ilustração fica parada na última fase.
 */

export type Pt = [number, number]

export type ItemConversa =
  | { tipo: 'marcador'; texto: string; de: number }
  | { tipo: 'cliente'; texto: string; de: number }
  | {
      tipo: 'negocio'
      texto: string
      de: number
      /** Botões de resposta; `tocada` é o índice que recebe o toque na fase `tocadaEm` */
      opcoes?: { lista: readonly string[]; tocada: number; tocadaEm: number }
      /** Fase em que o ✓✓ fica azul (lido); null = só entregue */
      lidoEm: number | null
    }
  | { tipo: 'digitando'; de: number; ate: number }

/** Itens da mesma posição ocupam o mesmo espaço (ex.: "digitando" e depois o balão) */
export type Posicao = ItemConversa[]

export type No = { id: string; label: string; icon: Icon; x: number; y: number; w: number }
export type Linha = { id: string; d: string }

export type Roteiro = {
  conversa: Posicao[]
  /** [fase, espera em ms antes de entrar nela] */
  passos: Array<[number, number]>
  /** id do nó → fase em que acende */
  nosAcesos: Record<string, number>
  /** id do nó → [de, até]: pulso suave enquanto espera algo */
  pulsos?: Record<string, [number, number]>
  /** Linha que se pinta de azul na fase indicada, com a duração do trajeto do ponto */
  rastros: Array<{ linha: string; fase: number; dur: number }>
  /** Trajetos do ponto azul (de centro a centro dos nós) */
  percursos: Array<{ fase: number; pontos: Pt[]; dur: number }>
}

export type CenarioId = 'atendimento' | 'campanha'

export type Cenario = {
  id: CenarioId
  rotulo: string
  descricao: string
  tituloFluxo: string
  nos: No[]
  linhas: Linha[]
  /** Roteiros se alternam a cada ciclo do mesmo cenário */
  roteiros: Roteiro[]
}

export const faseFinal = (r: Roteiro) => r.passos[r.passos.length - 1][0]

// ---------- Geometria comum do fluxo (área de 288×290) ----------

export const FLUXO = { w: 288, h: 290 }
export const NODE_H = 36
const CX = 144
const Y = [16, 88, 160, 244]
const mid = (y: number) => y + NODE_H / 2

const tronco = (y: number) => ({ x: 59, y, w: 170 })
const ramoEsq = { x: 0, y: Y[3], w: 140 }
const ramoDir = { x: 148, y: Y[3], w: 140 }

const LINHAS: Linha[] = [
  { id: 'l1', d: `M${CX} 52 V88` },
  { id: 'l2', d: `M${CX} 124 V160` },
  { id: 'ramo0', d: `M${CX} 196 V214 Q${CX} 220 ${CX - 6} 220 H76 Q70 220 70 226 V244` },
  { id: 'ramo1', d: `M${CX} 196 V214 Q${CX} 220 ${CX + 6} 220 H212 Q218 220 218 226 V244` },
]

const TRECHO_1: Pt[] = [[CX, mid(Y[0])], [CX, mid(Y[1])]]
const TRECHO_2: Pt[] = [[CX, mid(Y[1])], [CX, mid(Y[2])]]
const RAMOS: Pt[][] = [
  [[CX, mid(Y[2])], [CX, 220], [70, 220], [70, mid(Y[3])]],
  [[CX, mid(Y[2])], [CX, 220], [218, 220], [218, mid(Y[3])]],
]
export const INICIO_PONTO = TRECHO_1[0]

const DUR = { curto: 500, ramo: 700 }

// ---------- Atendimento: o cliente fala primeiro ----------

const OPCOES_ATENDIMENTO = ['Agendar', 'Preços', 'Falar com atendente'] as const

function roteiroAtendimento(cliente: string, escolha: number, resposta: string): Roteiro {
  const ramo = escolha === 0 ? 0 : 1
  return {
    conversa: [
      [{ tipo: 'cliente', texto: cliente, de: 1 }],
      [
        { tipo: 'digitando', de: 2, ate: 3 },
        {
          tipo: 'negocio',
          texto: 'Olá! Escolha uma opção:',
          de: 4,
          opcoes: { lista: OPCOES_ATENDIMENTO, tocada: escolha, tocadaEm: 6 },
          lidoEm: 6,
        },
      ],
      [
        { tipo: 'digitando', de: 7, ate: 7 },
        { tipo: 'negocio', texto: resposta, de: 8, lidoEm: null },
      ],
    ],
    passos: [
      [1, 600],
      [2, 600],
      [3, 500],
      [4, 600],
      [5, 500],
      [6, 1100],
      [7, 700],
      [8, 700],
    ],
    nosAcesos: { recebida: 1, saudacao: 3, menu: 5, [ramo === 0 ? 'agendar' : 'atendente']: 7 },
    rastros: [
      { linha: 'l1', fase: 2, dur: DUR.curto },
      { linha: 'l2', fase: 4, dur: DUR.curto },
      { linha: ramo === 0 ? 'ramo0' : 'ramo1', fase: 6, dur: DUR.ramo },
    ],
    percursos: [
      { fase: 2, pontos: TRECHO_1, dur: DUR.curto },
      { fase: 4, pontos: TRECHO_2, dur: DUR.curto },
      { fase: 6, pontos: RAMOS[ramo], dur: DUR.ramo },
    ],
  }
}

const ATENDIMENTO: Cenario = {
  id: 'atendimento',
  rotulo: 'Atendimento',
  descricao: 'O cliente chama. O Senderix responde.',
  tituloFluxo: 'Fluxo · Atendimento',
  nos: [
    { id: 'recebida', label: 'Mensagem recebida', icon: IconMessage, ...tronco(Y[0]) },
    { id: 'saudacao', label: 'Saudação', icon: IconMoodSmile, ...tronco(Y[1]) },
    { id: 'menu', label: 'Menu', icon: IconListDetails, ...tronco(Y[2]) },
    { id: 'agendar', label: 'Agendar', icon: IconCalendar, ...ramoEsq },
    { id: 'atendente', label: 'Atendente humano', icon: IconHeadset, ...ramoDir },
  ],
  linhas: LINHAS,
  roteiros: [
    roteiroAtendimento('Oi, queria marcar um horário', 0, 'Ótimo! Qual dia fica melhor para você?'),
    roteiroAtendimento(
      'Oi, preciso falar com alguém da equipe',
      2,
      'Certo. Já avisei a equipe, alguém vai te responder por aqui.',
    ),
  ],
}

// ---------- Campanha: o negócio fala primeiro ----------

const CAMPANHA: Cenario = {
  id: 'campanha',
  rotulo: 'Campanha',
  descricao: 'Você dispara. O Senderix conduz a resposta.',
  tituloFluxo: 'Fluxo · Campanha',
  nos: [
    { id: 'disparada', label: 'Campanha disparada', icon: IconSpeakerphone, ...tronco(Y[0]) },
    { id: 'aguardando', label: 'Aguardando resposta', icon: IconClock, ...tronco(Y[1]) },
    { id: 'menu', label: 'Menu', icon: IconListDetails, ...tronco(Y[2]) },
    { id: 'atendente', label: 'Atendente humano', icon: IconHeadset, ...ramoEsq },
    // Saída de quem toca "Não tenho interesse": existe no desenho, não acende neste roteiro
    { id: 'encerrar', label: 'Encerrar', icon: IconCircleX, ...ramoDir },
  ],
  linhas: LINHAS,
  roteiros: [
    {
      conversa: [
        [{ tipo: 'marcador', texto: 'Campanha · Semana do cliente', de: 1 }],
        [
          {
            tipo: 'negocio',
            texto:
              'Oi, Ana! Esta semana tem 15% de desconto em qualquer serviço pra quem já é cliente. Quer aproveitar?',
            de: 1,
            opcoes: {
              lista: ['Quero aproveitar', 'Falar com atendente', 'Não tenho interesse'],
              tocada: 0,
              tocadaEm: 4,
            },
            lidoEm: 3,
          },
        ],
        [{ tipo: 'cliente', texto: 'Quero aproveitar', de: 4 }],
        [
          { tipo: 'digitando', de: 6, ate: 6 },
          { tipo: 'negocio', texto: 'Ótimo! Vou te passar para a nossa equipe finalizar.', de: 7, lidoEm: null },
        ],
      ],
      passos: [
        [1, 600], // balão enviado + nó "Campanha disparada"
        [2, 700], // ponto segue para "Aguardando resposta"
        [3, 500], // aguardando acende e pulsa; ✓✓ lido
        [4, 1000], // cliente toca "Quero aproveitar"; ponto segue para "Menu"
        [5, 500], // menu acende; ponto desce pelo ramo do atendente
        [6, 700], // atendente acende; robô digitando
        [7, 800], // robô confirma
      ],
      nosAcesos: { disparada: 1, aguardando: 3, menu: 5, atendente: 6 },
      pulsos: { aguardando: [3, 3] },
      rastros: [
        { linha: 'l1', fase: 2, dur: DUR.curto },
        { linha: 'l2', fase: 4, dur: DUR.curto },
        { linha: 'ramo0', fase: 5, dur: DUR.ramo },
      ],
      percursos: [
        { fase: 2, pontos: TRECHO_1, dur: DUR.curto },
        { fase: 4, pontos: TRECHO_2, dur: DUR.curto },
        { fase: 5, pontos: RAMOS[0], dur: DUR.ramo },
      ],
    },
  ],
}

export const CENARIOS: Record<CenarioId, Cenario> = { atendimento: ATENDIMENTO, campanha: CAMPANHA }
export const ORDEM: CenarioId[] = ['atendimento', 'campanha']
