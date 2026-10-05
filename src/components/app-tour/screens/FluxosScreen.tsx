'use client'

// Réplica de pages/AutomacaoEditor.jsx: cabeçalho do fluxo, paleta de blocos,
// canvas pontilhado do React Flow (desenhado com divs e SVG) e painel do bloco.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconCircleCheck,
  IconDeviceFloppy,
  IconFlag,
  IconGitBranch,
  IconHeadset,
  IconHelpCircle,
  IconLoader,
  IconMaximize,
  IconMenu2,
  IconMessageCircle,
  IconMinus,
  IconPlus,
  IconTrash,
  IconX,
  type Icon,
} from '@tabler/icons-react'
import { FLUXO_BOTOES_NOVOS, FLUXO_NOME, FLUXO_TEXTO_NOVO } from '../data'
import { AppShell, Campo, Modal, Toast, labelCls } from '../ui'
import { useEstadoTela, useTimeline, type Roteiro, type TelaProps } from '../useTimeline'

type Tipo = 'mensagem' | 'menu' | 'espera_texto' | 'condicao' | 'transferir' | 'fim'

const TIPOS: Record<Tipo, { rotulo: string; Icon: Icon; borda: string; faixa: string; botao: string }> = {
  mensagem: {
    rotulo: 'Mensagem',
    Icon: IconMessageCircle,
    borda: 'border-sky-300 dark:border-sky-700',
    faixa: 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    botao: 'text-sky-700 dark:text-sky-300',
  },
  menu: {
    rotulo: 'Menu',
    Icon: IconMenu2,
    borda: 'border-violet-300 dark:border-violet-700',
    faixa: 'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    botao: 'text-violet-700 dark:text-violet-300',
  },
  espera_texto: {
    rotulo: 'Pergunta',
    Icon: IconHelpCircle,
    borda: 'border-amber-300 dark:border-amber-700',
    faixa: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    botao: 'text-amber-700 dark:text-amber-300',
  },
  condicao: {
    rotulo: 'Condição',
    Icon: IconGitBranch,
    borda: 'border-teal-300 dark:border-teal-700',
    faixa: 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    botao: 'text-teal-700 dark:text-teal-300',
  },
  transferir: {
    rotulo: 'Transferir',
    Icon: IconHeadset,
    borda: 'border-pink-300 dark:border-pink-700',
    faixa: 'bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    botao: 'text-pink-700 dark:text-pink-300',
  },
  fim: {
    rotulo: 'Fim',
    Icon: IconCircleCheck,
    borda: 'border-slate-300 dark:border-slate-600',
    faixa: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    botao: 'text-slate-600 dark:text-slate-300',
  },
}
const ORDEM_TIPOS: Tipo[] = ['mensagem', 'menu', 'espera_texto', 'condicao', 'transferir', 'fim']

// Mesma regra de gerarIdBotao do editor
const idBotao = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

type Pt = { x: number; y: number }

// Posições no canvas (zoom 1). O bloco novo nasce no centro do canvas, como no app
const N1: Pt = { x: 32, y: 28 }
const N2: Pt = { x: 32, y: 166 }
const N3_INICIO: Pt = { x: 280, y: 258 }
const N3_FIM: Pt = { x: 208, y: 404 }
const NODE_W = 240
const ROLAGEM_PAINEL = 214

type Estado = {
  novo: boolean
  pos: Pt
  durArraste: number
  selecionado: boolean
  texto: string
  botoes: string[]
  rascunho: string
  aresta: boolean
  durAresta: number
  foco: null | 'texto' | 'botao'
  rolagem: number
  alterado: boolean
  modal: boolean
  salvando: boolean
  toast: boolean
}

const INICIAL: Estado = {
  novo: false,
  pos: N3_INICIO,
  durArraste: 0,
  selecionado: false,
  texto: '',
  botoes: [],
  rascunho: '',
  aresta: false,
  durAresta: 0,
  foco: null,
  rolagem: 0,
  alterado: false,
  modal: false,
  salvando: false,
  toast: false,
}

const FINAL: Estado = {
  ...INICIAL,
  novo: true,
  pos: N3_FIM,
  texto: FLUXO_TEXTO_NOVO,
  botoes: FLUXO_BOTOES_NOVOS,
  aresta: true,
  toast: true,
}

const truncar = (t: string, max = 60) => (t.length > max ? `${t.slice(0, max).trimEnd()}…` : t)

// Bezier padrão do React Flow (calculateControlOffset com curvatura 0.25)
const offset = (d: number) => (d >= 0 ? 0.5 * d : 0.25 * 25 * Math.sqrt(-d))

function curva(s: Pt, lado: 'baixo' | 'direita', t: Pt) {
  const c1 = lado === 'baixo' ? { x: s.x, y: s.y + offset(t.y - s.y) } : { x: s.x + offset(t.x - s.x), y: s.y }
  const c2 = { x: t.x, y: t.y - offset(t.y - s.y) }
  const meio = {
    x: 0.125 * s.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * t.x,
    y: 0.125 * s.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * t.y,
  }
  return { d: `M${s.x},${s.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${t.x},${t.y}`, meio }
}

const HANDLE = 'absolute size-2.5 rounded-full border border-white bg-slate-400 dark:border-slate-900 dark:bg-slate-500'

function Bloco({
  tipo,
  nome,
  texto,
  botoes = [],
  inicial,
  selecionado,
  tour,
  refPadrao,
  semEntrada,
}: {
  tipo: Tipo
  nome: string
  texto?: string
  botoes?: string[]
  inicial?: boolean
  selecionado?: boolean
  tour?: string
  refPadrao?: (el: HTMLDivElement | null) => void
  semEntrada?: boolean
}) {
  const t = TIPOS[tipo]
  return (
    <div
      className={`w-60 rounded-xl border-2 bg-white dark:bg-slate-900 ${t.borda} ${selecionado ? 'shadow-lg' : 'shadow-xs'} ${
        inicial ? 'ring-2 ring-(--app-primary) ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : ''
      }`}
    >
      {!semEntrada && (
        <span data-tour={tour && `${tour}-entrada`} className={`${HANDLE} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
      )}
      <span className={`${HANDLE} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2`} />
      <div
        data-tour={tour && `${tour}-cabecalho`}
        className={`flex items-center justify-between gap-2 rounded-t-[10px] px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase ${t.faixa}`}
      >
        <span className="flex items-center gap-1.5">
          <t.Icon size={13} stroke={2.25} /> {t.rotulo}
        </span>
        {inicial && (
          <span className="flex items-center gap-1 rounded-full bg-(--app-primary) px-1.5 py-0.5 text-[10px] tracking-normal text-white normal-case">
            <IconFlag size={10} stroke={2.5} /> Inicial
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{nome}</p>
        {texto && (
          <p className="mt-1 text-xs leading-snug break-words text-slate-500 dark:text-slate-400">{truncar(texto)}</p>
        )}
        {botoes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {botoes.map((b) => (
              <span
                key={b}
                className="tour-entra max-w-full truncate rounded-sm border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
              >
                {b}
              </span>
            ))}
          </div>
        )}
        {tipo === 'menu' && (
          <div ref={refPadrao} className="relative -mx-3 mt-2 flex justify-end px-3">
            <span className="rounded-sm border border-dashed border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:text-slate-400">
              Qualquer opção
            </span>
            <span
              data-tour={tour && `${tour}-padrao`}
              className="absolute top-1/2 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-400 bg-white dark:border-slate-500 dark:bg-slate-900"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CampoPainel({ label, dica, children }: { label: string; dica?: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {dica && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{dica}</p>}
    </div>
  )
}

export default function FluxosScreen({ ativo, chave, estatico, aoTerminar }: TelaProps) {
  const [s, set, reiniciar] = useEstadoTela(INICIAL, FINAL, estatico)
  const mascara = useId()

  // Geometria medida dos blocos fixos: base do 1º e saída "Qualquer opção" do 2º
  const n1 = useRef<HTMLDivElement>(null)
  const n2 = useRef<HTMLDivElement>(null)
  const linhaPadrao = useRef<HTMLDivElement | null>(null)
  const [geo, setGeo] = useState({ n1h: 92, padraoY: 128 })

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const l = linhaPadrao.current
      setGeo({
        n1h: n1.current?.offsetHeight ?? 92,
        padraoY: l ? l.offsetTop + l.offsetHeight / 2 : 128,
      })
    })
    if (n1.current) ro.observe(n1.current)
    if (n2.current) ro.observe(n2.current)
    return () => ro.disconnect()
  }, [])

  const roteiro: Roteiro = async (t) => {
    await t.esperar(300)
    // O app adiciona o bloco com um clique na paleta: ele nasce selecionado no centro do canvas
    await t.clicar('paleta-menu')
    set({ novo: true, selecionado: true, alterado: true })
    await t.esperar(550)

    // Arrasta o bloco para baixo do menu de segmento
    await t.mover('n3-cabecalho')
    t.pressionar(true)
    await t.esperar(120)
    await t.mover('n3-cabecalho', {
      dx: N3_FIM.x - N3_INICIO.x,
      dy: N3_FIM.y - N3_INICIO.y,
      aoIniciar: (dur) => set({ pos: N3_FIM, durArraste: dur }),
    })
    t.pressionar(false)
    await t.esperar(250)

    // Liga a saída "Qualquer opção" ao bloco novo
    await t.mover('n2-padrao')
    t.pressionar(true)
    await t.esperar(120)
    await t.mover('n3-entrada', { aoIniciar: (dur) => set({ aresta: true, durAresta: dur }) })
    t.pressionar(false)
    await t.esperar(350)

    await t.clicar('painel-texto')
    set({ foco: 'texto' })
    await t.digitar(FLUXO_TEXTO_NOVO, (texto) => set({ texto }))
    await t.esperar(350)
    set({ foco: null, rolagem: ROLAGEM_PAINEL })
    await t.esperar(750)

    for (const titulo of FLUXO_BOTOES_NOVOS) {
      await t.clicar('painel-novo-botao')
      set({ foco: 'botao' })
      await t.digitar(titulo, (rascunho) => set({ rascunho }), 40)
      await t.clicar('painel-adicionar')
      set((e) => ({ botoes: [...e.botoes, titulo], rascunho: '', foco: null }))
      await t.esperar(300)
    }

    // Os botões do menu novo ainda não têm saída: o editor avisa antes de salvar
    await t.clicar('salvar')
    set({ modal: true })
    await t.esperar(1600)
    await t.clicar('modal-salvar')
    set({ modal: false, salvando: true })
    await t.esperar(650)
    // Depois de salvar, o editor recarrega o grafo: a seleção some e o painel fecha
    set({ salvando: false, alterado: false, selecionado: false, toast: true })
  }

  useTimeline({ roteiro, reiniciar, ativo: ativo && !estatico, chave, aoTerminar })

  const n1Base = { x: N1.x + NODE_W / 2, y: N1.y + geo.n1h }
  const n2Topo = { x: N2.x + NODE_W / 2, y: N2.y }
  const saidaPadrao = { x: N2.x + NODE_W, y: N2.y + geo.padraoY }
  const entradaNovo = { x: s.pos.x + NODE_W / 2, y: s.pos.y }
  const a1 = curva(n1Base, 'baixo', n2Topo)
  const a2 = curva(saidaPadrao, 'direita', entradaNovo)
  const painel = s.novo && s.selecionado
  const avisos = FLUXO_BOTOES_NOVOS.map((b) => `O botão "${b}" do menu "Novo menu" não tem conexão de saída.`)

  return (
    <AppShell
      ativo="automacao"
      sobreposicoes={
        <>
          <Modal on={s.modal} largura={480}>
            <div className="w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Revise antes de salvar</h3>
                <IconX size={20} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-900/20">
                <ul className="space-y-1.5">
                  {avisos.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <IconAlertTriangle size={15} className="mt-0.5 shrink-0" /> {m}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-300/80">
                  Contatos que clicarem nesses botões não receberão resposta.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Cancelar
                </div>
                <div
                  data-tour="modal-salvar"
                  className="flex-1 rounded-lg bg-(--app-primary) py-2.5 text-center text-sm font-medium text-white"
                >
                  Salvar mesmo assim
                </div>
              </div>
            </div>
          </Modal>
          <Toast on={s.toast} mensagem="Fluxo salvo." />
        </>
      }
    >
      <div className="flex h-full flex-col gap-4">
        {/* Cabeçalho */}
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <IconArrowLeft size={15} /> Voltar
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <div className="-mx-2 flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5">
                <h2 className="truncate text-xl font-semibold text-slate-800 dark:text-slate-100">{FLUXO_NOME}</h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <IconCheck size={11} stroke={2.5} /> Ativo
              </span>
              <div className="flex shrink-0 items-center gap-2.5 border-l border-slate-200 pl-3 dark:border-slate-700">
                <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-(--app-primary)">
                  <span className="inline-block h-3.5 w-3.5 translate-x-[18px] rounded-full bg-white shadow-sm" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Fluxo de saudação</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Responde automaticamente quem envia mensagem pela primeira vez
                  </p>
                </div>
              </div>
              {s.alterado && (
                <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">Alterações não salvas</span>
              )}
            </div>
          </div>
          <div
            data-tour="salvar"
            className={`flex shrink-0 items-center gap-2 rounded-lg bg-(--app-primary) px-4 py-2 text-sm font-medium text-white ${
              !s.alterado || s.salvando ? 'opacity-50' : ''
            }`}
          >
            {s.salvando ? <IconLoader size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
            {s.salvando ? 'Salvando...' : 'Salvar'}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-4">
          {/* Paleta */}
          <div className="w-44 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">Blocos</p>
            <div className="space-y-1">
              {ORDEM_TIPOS.map((tipo) => {
                const { rotulo, Icon, botao } = TIPOS[tipo]
                return (
                  <div
                    key={tipo}
                    data-tour={`paleta-${tipo}`}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium ${botao}`}
                  >
                    <Icon size={16} stroke={2} /> {rotulo}
                  </div>
                )
              })}
            </div>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Arraste da bolinha inferior de um bloco até outro para conectar. Selecione e aperte Delete para excluir.
            </p>
          </div>

          {/* Canvas */}
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: 'var(--xy-bg)',
                backgroundImage: 'radial-gradient(circle, var(--xy-dots) 0.75px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none">
              <path d={a1.d} stroke="var(--xy-edge)" strokeWidth="1" />
              {s.novo && (
                <>
                  <mask id={mascara} maskUnits="userSpaceOnUse">
                    <path
                      d={a2.d}
                      pathLength={1}
                      stroke="#fff"
                      strokeWidth="4"
                      className="tour-traco"
                      data-on={s.aresta}
                      style={{ ['--dur' as string]: `${s.durAresta}ms` }}
                    />
                  </mask>
                  <path d={a2.d} stroke="var(--xy-edge)" strokeWidth="1" strokeDasharray="5 4" mask={`url(#${mascara})`} />
                </>
              )}
            </svg>
            {s.novo && (
              <div
                className="absolute rounded-[2px] bg-(--xy-label-bg) px-1 py-px text-[10px] whitespace-nowrap transition-opacity duration-200"
                style={{
                  left: a2.meio.x,
                  top: a2.meio.y,
                  transform: 'translate(-50%, -50%)',
                  opacity: s.aresta ? 1 : 0,
                  transitionDelay: s.aresta && !estatico ? `${s.durAresta}ms` : '0ms',
                }}
              >
                Qualquer opção
              </div>
            )}

            <div ref={n1} className="absolute top-0 left-0" style={{ transform: `translate(${N1.x}px, ${N1.y}px)` }}>
              <Bloco tipo="espera_texto" nome="Pedir nome" texto="Olá! Como você se chama?" inicial semEntrada />
            </div>
            <div ref={n2} className="absolute top-0 left-0" style={{ transform: `translate(${N2.x}px, ${N2.y}px)` }}>
              <Bloco
                tipo="menu"
                nome="Segmento"
                texto="{{nome}}, qual o segmento do seu negócio?"
                botoes={['Beleza', 'Comércio', 'Saúde', 'Outro']}
                tour="n2"
                refPadrao={(el) => {
                  linhaPadrao.current = el
                }}
              />
            </div>
            {s.novo && (
              <div
                className="absolute top-0 left-0 z-10"
                style={{
                  transform: `translate(${s.pos.x}px, ${s.pos.y}px)`,
                  transition: s.durArraste ? `transform ${s.durArraste}ms cubic-bezier(0.65, 0, 0.35, 1)` : undefined,
                }}
              >
                <div className="tour-popup">
                  <Bloco tipo="menu" nome="Novo menu" texto={s.texto} botoes={s.botoes} selecionado={s.selecionado} tour="n3" />
                </div>
              </div>
            )}

            {/* Controles do React Flow */}
            <div className="absolute bottom-[15px] left-[15px] flex flex-col shadow-[0_0_2px_1px_rgba(0,0,0,0.08)]">
              {[IconPlus, IconMinus, IconMaximize].map((I, i) => (
                <span
                  key={i}
                  className="flex size-[26px] items-center justify-center border-b border-(--xy-controls-border) bg-(--xy-controls-bg) text-(--xy-controls-fg) last:border-b-0"
                >
                  <I size={12} stroke={2.5} />
                </span>
              ))}
            </div>
          </div>

          {/* Painel do bloco selecionado */}
          {painel && (
            <div className="tour-painel w-80 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="tour-rolagem space-y-4 p-4" style={{ transform: `translateY(${-s.rolagem}px)` }}>
                <div className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[11px] font-semibold tracking-wide text-violet-700 uppercase dark:bg-violet-900/40 dark:text-violet-300">
                  <IconMenu2 size={13} stroke={2.25} /> Menu
                </div>
                <CampoPainel label="Nome do bloco">
                  <Campo valor="Novo menu" />
                </CampoPainel>
                <div className="flex items-center gap-2.5">
                  <span className="size-4 rounded-[4px] border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Bloco inicial</span>
                </div>
                <CampoPainel label="Texto" dica="Use {{variavel}} para inserir valores, ex: {{name}}.">
                  <Campo valor={s.texto} focado={s.foco === 'texto'} tour="painel-texto" multilinha className="h-[98px]" />
                </CampoPainel>
                <CampoPainel
                  label="Salvar resposta em (opcional)"
                  dica="Guarda o texto do botão escolhido, ex: segmento → {{segmento}}. Só letras minúsculas, números e _."
                >
                  <Campo valor="" placeholder="ex: segmento" />
                </CampoPainel>
                <CampoPainel label="Rodapé">
                  <Campo valor="" placeholder="Senderix" />
                </CampoPainel>
                <div>
                  <label className={labelCls}>Botões</label>
                  <div className="space-y-2">
                    {s.botoes.length === 0 && (
                      <p className="text-xs text-slate-400 italic dark:text-slate-500">Nenhum botão ainda.</p>
                    )}
                    {s.botoes.map((b) => (
                      <div key={b} className="tour-entra flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <Campo valor={b} />
                          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            id: {idBotao(b)}
                          </p>
                        </div>
                        <IconX size={16} className="mt-2 self-start text-slate-400 dark:text-slate-500" />
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <Campo valor={s.rascunho} placeholder="Novo botão" focado={s.foco === 'botao'} tour="painel-novo-botao" />
                      <div
                        data-tour="painel-adicionar"
                        className={`flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 ${
                          s.rascunho.trim() ? '' : 'opacity-50'
                        }`}
                      >
                        <IconPlus size={13} /> Adicionar
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2 dark:border-slate-700">
                  <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 dark:border-red-800 dark:text-red-400">
                    <IconTrash size={14} /> Excluir bloco
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
