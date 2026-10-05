'use client'

// Réplica de pages/Campanhas.jsx: formulário em 4 passos (base de contatos,
// mensagem, instâncias, disparo) e o modal de progresso do disparo.

import { useRef, type ReactNode, type Ref } from 'react'
import {
  IconBolt,
  IconCheck,
  IconChevronDown,
  IconCircleX,
  IconClock,
  IconDeviceMobile,
  IconFileSpreadsheet,
  IconInfoCircle,
  IconLoader,
  IconPencil,
  IconPlayerPause,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSend,
  IconSettings,
  IconTemplate,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import {
  CAMPANHA_NOME,
  CONTATOS_CAMPANHA,
  FLUXOS_CAMPANHA,
  FLUXO_CAMPANHA_BOTOES,
  FLUXO_CAMPANHA_ID,
  FLUXO_CAMPANHA_TEXTO,
  HORARIOS_ENVIO,
  INSTANCIAS,
  INSTANCIAS_CAMPANHA,
  TOTAL_CONTATOS_CAMPANHA,
} from '../data'
import { AppShell, Campo, Modal, Toast, btnBorda, labelCls } from '../ui'
import { useEstadoTela, useTimeline, type Roteiro, type TelaProps } from '../useTimeline'

const PROCESSADOS_FINAL = 14
// Rolagem até o fim da página (estado final estático, sem medir nada)
const FIM = -1
const INDICE_FALHA = 4

type Estado = {
  abaContatos: 'planilha' | 'existentes'
  selecionados: boolean
  usados: boolean
  abaMsg: 'modelo' | 'digitar' | 'fluxo'
  popup: boolean
  opcaoHover: number | null
  fluxoId: number | null
  instancias: number[]
  nome: string
  foco: boolean
  rolagem: number
  enviando: boolean
  toast: boolean
  progresso: boolean
  processados: number
}

const INICIAL: Estado = {
  abaContatos: 'planilha',
  selecionados: false,
  usados: false,
  abaMsg: 'modelo',
  popup: false,
  opcaoHover: null,
  fluxoId: null,
  instancias: [],
  nome: '',
  foco: false,
  rolagem: 0,
  enviando: false,
  toast: false,
  progresso: false,
  processados: 0,
}

// Depois do disparo o app limpa o formulário e abre o progresso
const FORM_LIMPO: Partial<Estado> = {
  abaContatos: 'existentes',
  selecionados: false,
  usados: false,
  fluxoId: null,
  instancias: [],
  nome: '',
}

const FINAL: Estado = {
  ...INICIAL,
  ...FORM_LIMPO,
  abaMsg: 'fluxo',
  rolagem: FIM,
  toast: true,
  progresso: true,
  processados: PROCESSADOS_FINAL,
}

function Passo({ n, titulo, children, refPasso }: { n: number; titulo: string; children: ReactNode; refPasso?: Ref<HTMLDivElement> }) {
  return (
    <div ref={refPasso}>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--app-primary) text-xs font-bold text-white">
          {n}
        </span>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex size-[13px] items-center justify-center rounded-[3px] border ${
        on ? 'border-[#0075ff] bg-[#0075ff]' : 'border-[#767676] bg-white'
      }`}
    >
      {on && <IconCheck size={10} stroke={3.5} className="text-white" />}
    </span>
  )
}

function Abas<T extends string>({
  itens,
  ativa,
  largura,
  tour,
}: {
  itens: [T, typeof IconUsers, string][]
  ativa: T
  largura?: boolean
  tour: string
}) {
  return (
    <div className={`mb-4 flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 ${largura ? '' : 'w-fit'}`}>
      {itens.map(([v, Icon, lbl]) => (
        <div
          key={v}
          data-tour={`${tour}-${v}`}
          className={`flex items-center gap-1.5 text-xs font-medium ${largura ? 'flex-1 justify-center py-2.5' : 'px-4 py-2.5'} ${
            ativa === v ? 'bg-(--app-primary) text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Icon size={13} /> {lbl}
        </div>
      ))}
    </div>
  )
}

// Negrito do WhatsApp (*texto*), como o parseWhatsApp do app
function textoWhats(texto: string) {
  return texto.split(/(\*[^*\n]+\*)/g).map((p, i) =>
    p.startsWith('*') && p.endsWith('*') ? <strong key={i}>{p.slice(1, -1)}</strong> : <span key={i}>{p}</span>,
  )
}

const TH = 'text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-2.5'

export default function CampanhasScreen({ ativo, chave, estatico, aoTerminar }: TelaProps) {
  const [s, set, reiniciar] = useEstadoTela(INICIAL, FINAL, estatico)
  const conteudo = useRef<HTMLDivElement>(null)
  const passo2 = useRef<HTMLDivElement>(null)
  const passo3 = useRef<HTMLDivElement>(null)
  const passo4 = useRef<HTMLDivElement>(null)

  // Área útil do <main> (palco menos p-6): o máximo que dá para rolar
  const ALTURA_MAIN = 664
  const rolarAte = (el: HTMLDivElement | null, folga = 16) => {
    const max = Math.max(0, (conteudo.current?.offsetHeight ?? 0) - ALTURA_MAIN)
    set({ rolagem: Math.min(max, Math.max(0, (el?.offsetTop ?? 0) - folga)) })
  }

  const roteiro: Roteiro = async (t) => {
    await t.esperar(300)
    // 1. Base: contatos já cadastrados, todos selecionados
    await t.clicar('contatos-existentes')
    set({ abaContatos: 'existentes' })
    await t.esperar(550)
    await t.clicar('selecionar-todos')
    set({ selecionados: true })
    await t.esperar(500)
    await t.clicar('usar-contatos')
    set({ usados: true })
    await t.esperar(450)

    // 2. Mensagem: a campanha já sai com um fluxo de resposta
    rolarAte(passo2.current)
    await t.esperar(750)
    await t.clicar('mensagem-fluxo')
    set({ abaMsg: 'fluxo' })
    await t.esperar(350)
    await t.clicar('select-fluxo')
    set({ popup: true })
    await t.esperar(250)
    await t.mover(`opcao-fluxo-${FLUXO_CAMPANHA_ID}`, { dx: -60 })
    set({ opcaoHover: FLUXO_CAMPANHA_ID })
    await t.clicar(`opcao-fluxo-${FLUXO_CAMPANHA_ID}`, { dx: -60 })
    set({ popup: false, opcaoHover: null, fluxoId: FLUXO_CAMPANHA_ID })
    await t.esperar(1300)

    // 3. Duas instâncias para alternar o envio
    rolarAte(passo3.current)
    await t.esperar(750)
    for (const id of INSTANCIAS_CAMPANHA) {
      await t.clicar(`instancia-${id}`)
      set((e) => ({ instancias: [...e.instancias, id] }))
      await t.esperar(200)
    }
    await t.esperar(250)

    // 4. Nome e disparo
    rolarAte(passo4.current)
    await t.esperar(750)
    await t.clicar('nome-campanha')
    set({ foco: true })
    await t.digitar(CAMPANHA_NOME, (nome) => set({ nome }))
    await t.esperar(350)
    await t.clicar('enviar')
    set({ foco: false, enviando: true })
    await t.esperar(800)
    set({ ...FORM_LIMPO, enviando: false, toast: true, progresso: true, processados: 0 })

    // Progresso devagar e plausível: o envio real espera segundos entre mensagens
    for (let i = 1; i <= PROCESSADOS_FINAL; i++) {
      await t.esperar(i === 1 ? 900 : 380 + ((i * 137) % 260))
      set({ processados: i })
    }
  }

  useTimeline({ roteiro, reiniciar, ativo: ativo && !estatico, chave, aoTerminar })

  const fluxo = FLUXOS_CAMPANHA.find((f) => f.id === s.fluxoId) ?? null
  const primeiroNome = s.usados ? CONTATOS_CAMPANHA[0].nome : 'João'
  const textoFinal = fluxo ? FLUXO_CAMPANHA_TEXTO.replace(/\{\{nome\}\}/g, primeiroNome) : ''

  const falhas = s.processados > INDICE_FALHA ? 1 : 0
  const enviados = s.processados - falhas
  const pct = Math.round((s.processados / TOTAL_CONTATOS_CAMPANHA) * 100)
  const instanciaDe = (i: number) => INSTANCIAS.find((d) => d.id === INSTANCIAS_CAMPANHA[i % 2])!.nome

  return (
    <AppShell
      ativo="campanhas"
      sobreposicoes={
        <>
          <Toast on={s.toast} mensagem="Campanha iniciada!" />
          <Modal on={s.progresso} largura={672}>
            <div className="w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <div className="flex min-w-0 items-center gap-3">
                  <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{CAMPANHA_NOME}</h3>
                  <span className="inline-flex shrink-0 animate-pulse items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Enviando
                  </span>
                </div>
                <IconX size={20} className="ml-4 text-slate-400 dark:text-slate-500" />
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Total', value: TOTAL_CONTATOS_CAMPANHA, color: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Enviados', value: enviados, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Falhas', value: falhas, color: 'text-red-500 dark:text-red-400' },
                    { label: 'Pulados', value: 0, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Progresso', value: `${pct}%`, color: 'text-(--app-primary)' },
                  ].map((k) => (
                    <div key={k.label} className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                      <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                    </div>
                  ))}
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="tour-barra h-2.5 rounded-full bg-emerald-500" style={{ transform: `scaleX(${pct / 100})` }} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    <IconPlayerPause size={15} /> Pausar
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-500 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                    <IconCircleX size={15} /> Cancelar
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <IconRefresh size={13} /> Atualizar
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="max-h-64 overflow-hidden">
                    <table className="w-full">
                      <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <tr>
                          {['Nome', 'Número', 'Instância', 'Status', 'Enviado em'].map((h) => (
                            <th key={h} className={TH}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {CONTATOS_CAMPANHA.map((c, i) => {
                          const status = i >= s.processados ? 'pendente' : i === INDICE_FALHA ? 'falhou' : 'enviado'
                          return (
                            <tr key={c.numero}>
                              <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{c.nome}</td>
                              <td className="px-4 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-300">{c.numero}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                                {status === 'pendente' ? '—' : instanciaDe(i)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                                    status === 'enviado'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : status === 'falhou'
                                        ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {status === 'pendente' ? '—' : HORARIOS_ENVIO[i]}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-700">
                <div className="w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Fechar
                </div>
              </div>
            </div>
          </Modal>
        </>
      }
    >
      <div
        ref={conteudo}
        className={`tour-rolagem space-y-6 ${s.rolagem === FIM ? 'absolute inset-x-6 bottom-6' : 'relative'}`}
        style={s.rolagem === FIM ? undefined : { transform: `translateY(${-s.rolagem}px)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Nova Campanha</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Configure e dispare sua campanha de WhatsApp</p>
          </div>
          <div className={btnBorda}>
            <IconSettings size={15} /> Configurações
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <IconPlus size={15} className="text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nova Campanha</h3>
          </div>

          <div className="space-y-8 p-6">
            {/* PASSO 1 */}
            <Passo n={1} titulo="Base de contatos">
              {!s.usados && (
                <Abas
                  tour="contatos"
                  ativa={s.abaContatos}
                  itens={[
                    ['planilha', IconFileSpreadsheet, 'Importar planilha'],
                    ['existentes', IconUsers, 'Contatos cadastrados'],
                  ]}
                />
              )}

              {s.abaContatos === 'planilha' && (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-10 dark:border-slate-600">
                  <IconFileSpreadsheet size={36} className="text-slate-300 dark:text-slate-600" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Arraste CSV ou XLSX aqui</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      ou clique para selecionar — colunas &quot;nome&quot; e &quot;numero&quot;
                    </p>
                  </div>
                </div>
              )}

              {s.abaContatos === 'existentes' && !s.usados && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <IconSearch size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                      <div className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                        Buscar por nome ou número...
                      </div>
                    </div>
                    <span data-tour="selecionar-todos" className="text-xs font-medium whitespace-nowrap text-(--app-primary)">
                      Selecionar todos
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">Desmarcar</span>
                  </div>
                  <div className="max-h-64 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full">
                      <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <tr>
                          <th className="w-10 px-4 py-2.5">
                            <Check on={s.selecionados} />
                          </th>
                          {['Nome', 'Número'].map((h) => (
                            <th key={h} className={TH}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {CONTATOS_CAMPANHA.map((c) => (
                          <tr key={c.numero} className={s.selecionados ? 'bg-(--app-primary)/5 dark:bg-(--app-primary)/10' : ''}>
                            <td className="w-10 px-4 py-2.5">
                              <Check on={s.selecionados} />
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{c.nome}</td>
                            <td className="px-4 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-300">{c.numero}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {s.selecionados && (
                    <div className="tour-entra flex items-center justify-between rounded-xl border border-(--app-primary)/20 bg-(--app-primary)/5 px-4 py-3 dark:bg-(--app-primary)/10">
                      <p className="text-sm font-medium text-(--app-primary)">
                        <span className="font-bold">{TOTAL_CONTATOS_CAMPANHA}</span> contatos selecionados
                      </p>
                      <div
                        data-tour="usar-contatos"
                        className="flex items-center gap-2 rounded-lg bg-(--app-primary) px-4 py-2 text-sm font-medium text-white"
                      >
                        <IconCheck size={14} /> Usar esses contatos
                      </div>
                    </div>
                  )}
                </div>
              )}

              {s.usados && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{TOTAL_CONTATOS_CAMPANHA}</span>{' '}
                      contatos selecionados
                    </p>
                    <span className="flex items-center gap-1 text-xs font-medium text-(--app-primary)">
                      <IconUsers size={12} /> Mudar seleção
                    </span>
                  </div>
                  <div className="max-h-52 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full">
                      <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <tr>
                          {['#', 'Nome', 'Número'].map((h) => (
                            <th key={h} className={TH}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {CONTATOS_CAMPANHA.map((c, i) => (
                          <tr key={c.numero}>
                            <td className="px-4 py-2 font-mono text-xs text-slate-400">{i + 1}</td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{c.nome}</td>
                            <td className="px-4 py-2 font-mono text-sm text-slate-600 dark:text-slate-300">{c.numero}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Passo>

            {/* PASSO 2 */}
            <Passo n={2} titulo="Configurar mensagem" refPasso={passo2}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Abas
                    tour="mensagem"
                    largura
                    ativa={s.abaMsg}
                    itens={[
                      ['modelo', IconTemplate, 'Usar modelo'],
                      ['digitar', IconPencil, 'Digitar mensagem'],
                      ['fluxo', IconBolt, 'Fluxo'],
                    ]}
                  />
                  <div className="space-y-3">
                    <div className="relative">
                      <div
                        data-tour="select-fluxo"
                        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100 ${
                          s.popup ? 'border-(--app-primary)' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {s.abaMsg === 'fluxo'
                          ? fluxo
                            ? `${fluxo.nome} (${fluxo.blocos} blocos)`
                            : 'Selecione um fluxo...'
                          : 'Selecione um modelo...'}
                        <IconChevronDown size={14} className="text-slate-500" />
                      </div>
                      {s.popup && (
                        // Lista nativa do <select> no Chromium/Electron (o app não define color-scheme: fica clara)
                        <div className="tour-popup absolute top-full right-0 left-0 z-10 border border-[#767676] bg-white py-0.5 text-[13px] text-black shadow-[0_2px_6px_rgb(0_0_0/0.25)]">
                          {[{ id: 0, nome: 'Selecione um fluxo...', blocos: 0 }, ...FLUXOS_CAMPANHA].map((f) => (
                            <div
                              key={f.id}
                              data-tour={`opcao-fluxo-${f.id}`}
                              className={`px-2 py-[3px] ${s.opcaoHover === f.id ? 'bg-[#1967d2] text-white' : ''} ${
                                f.id === 0 && s.opcaoHover === null ? 'bg-[#cecece]' : ''
                              }`}
                            >
                              {f.id ? `${f.nome} (${f.blocos} blocos)` : f.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {fluxo && (
                      <div className="tour-popup flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        <IconInfoCircle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          A campanha enviará a primeira mensagem do fluxo. A partir da resposta do contato, a conversa segue
                          automaticamente.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pré-visualização: tema escuro no modo claro e claro no modo escuro, como no app */}
                <div className="rounded-xl bg-[#0b141a] p-4 dark:bg-[#E8E3D9]">
                  <p className="mb-3 text-center text-[10px] font-semibold tracking-widest text-gray-500 uppercase dark:text-[#7a7a7a]">
                    Pré-visualização
                  </p>
                  <div className="flex flex-col items-end">
                    <div className="max-w-[240px] rounded-lg bg-[#005c4b] p-3 text-sm leading-relaxed text-white shadow-xs dark:bg-[#E2FFC8] dark:text-[#1a1a1a]">
                      <div className="break-words whitespace-pre-wrap">
                        {textoFinal ? (
                          <span className="tour-popup block">{textoWhats(textoFinal)}</span>
                        ) : (
                          <span className="text-xs text-white/30 italic dark:text-[#1a1a1a]/30">Sua mensagem aparecerá aqui...</span>
                        )}
                      </div>
                    </div>
                    {fluxo &&
                      FLUXO_CAMPANHA_BOTOES.map((b) => (
                        <div
                          key={b}
                          className="tour-popup mt-1 flex w-full max-w-[240px] items-center justify-center rounded-lg bg-[#005c4b]/60 px-4 py-2 text-center text-sm text-[#53bdeb] dark:bg-[#1a1a1a]/10 dark:text-[#1a5fb4]"
                        >
                          {b}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Passo>

            {/* PASSO 3 */}
            <Passo n={3} titulo="Selecionar instâncias WhatsApp" refPasso={passo3}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-medium text-(--app-primary)">Selecionar todas</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Desmarcar todas</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {INSTANCIAS.map((d) => {
                  const on = s.instancias.includes(d.id)
                  return (
                    <div
                      key={d.id}
                      data-tour={`instancia-${d.id}`}
                      className={`relative rounded-xl border-2 p-4 ${
                        on ? 'border-(--app-primary) bg-(--app-primary)/5' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {on && (
                        <div className="tour-popup absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-(--app-primary)">
                          <IconCheck size={11} color="white" stroke={3} />
                        </div>
                      )}
                      <IconDeviceMobile size={20} className="mb-2 text-(--app-primary)" />
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{d.nome}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{d.numero}</p>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
                      </span>
                    </div>
                  )
                })}
              </div>
            </Passo>

            {/* PASSO 4 */}
            <Passo n={4} titulo="Finalizar e disparar" refPasso={passo4}>
              <div className="max-w-lg space-y-4">
                <div>
                  <label className={labelCls}>Nome da campanha</label>
                  <Campo
                    valor={s.nome}
                    placeholder="Ex: Promoção de Natal – Lista VIP"
                    focado={s.foco}
                    tour="nome-campanha"
                    className="py-2.5"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <IconClock size={15} className="text-slate-400 dark:text-slate-500" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Agendar envio</p>
                  </div>
                  <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700">
                    <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow-sm" />
                  </span>
                </div>
                <div
                  data-tour="enviar"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-(--app-primary) py-3 text-sm font-semibold text-white ${
                    s.enviando ? 'opacity-50' : ''
                  }`}
                >
                  {s.enviando ? (
                    <>
                      <IconLoader size={18} className="animate-spin" /> Criando campanha...
                    </>
                  ) : (
                    <>
                      <IconSend size={18} /> Enviar agora
                    </>
                  )}
                </div>
              </div>
            </Passo>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

