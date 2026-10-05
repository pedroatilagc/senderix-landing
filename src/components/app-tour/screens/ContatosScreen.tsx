'use client'

// Réplica de pages/Contatos.jsx: KPIs, barra de busca e ações em massa,
// tabela com avatar de inicial (lib/avatarInicial.js).

import { useRef } from 'react'
import {
  IconBan,
  IconCheck,
  IconChevronDown,
  IconCircleX,
  IconCopy,
  IconDownload,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { BUSCA_CONTATOS, CONTATOS, CONTATO_OPT_OUT, type Contato } from '../data'
import { AppShell, Caret, btnBorda, focoCls } from '../ui'
import { useFlip } from '../useFlip'
import { useEstadoTela, useTimeline, type Roteiro, type TelaProps } from '../useTimeline'

// Pares fundo 100 + texto 700, mesma paleta e mesmo cálculo de corDoNome do app
const PALETA = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-slate-100 text-slate-700',
]
const corDoNome = (nome: string) => PALETA[[...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETA.length]

type Estado = { busca: string; filtro: string; foco: boolean; contatos: Contato[] }

const INICIAL: Estado = { busca: '', filtro: '', foco: false, contatos: CONTATOS }
const FINAL: Estado = {
  ...INICIAL,
  contatos: CONTATOS.map((c) => (c.id === CONTATO_OPT_OUT ? { ...c, optOut: true } : c)),
}

const confere = (c: Contato, q: string) => !q || c.nome.toLowerCase().includes(q.toLowerCase())

export default function ContatosScreen({ ativo, chave, estatico, aoTerminar }: TelaProps) {
  const [s, set, reiniciar] = useEstadoTela(INICIAL, FINAL, estatico)
  const corpo = useRef<HTMLTableSectionElement>(null)
  useFlip(corpo, estatico)

  const roteiro: Roteiro = async (t) => {
    await t.esperar(400)
    await t.clicar('busca')
    set({ foco: true })
    // A tabela filtra a cada tecla: quem sai some primeiro, o resto desliza para cima
    for (let i = 1; i <= BUSCA_CONTATOS.length; i++) {
      const parcial = BUSCA_CONTATOS.slice(0, i)
      set({ busca: parcial })
      await t.esperar(160)
      set({ filtro: parcial })
      await t.esperar(220)
    }
    await t.esperar(1500)
    for (let i = BUSCA_CONTATOS.length - 1; i >= 0; i--) {
      const parcial = BUSCA_CONTATOS.slice(0, i)
      set({ busca: parcial, filtro: parcial })
      await t.esperar(120)
    }
    set({ foco: false })
    await t.esperar(700)

    await t.clicar(`optout-${CONTATO_OPT_OUT}`)
    set((e) => ({ contatos: e.contatos.map((c) => (c.id === CONTATO_OPT_OUT ? { ...c, optOut: !c.optOut } : c)) }))
  }

  useTimeline({ roteiro, reiniciar, ativo: ativo && !estatico, chave, aoTerminar })

  const visiveis = s.contatos.filter((c) => confere(c, s.filtro))
  const total = s.contatos.length
  const optOuts = s.contatos.filter((c) => c.optOut).length

  return (
    <AppShell ativo="contatos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Contatos</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Gerencie sua base de números WhatsApp</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={btnBorda}>
              <IconDownload size={15} /> Exportar
            </div>
            <div className={btnBorda}>
              <IconUpload size={15} /> Importar
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-(--app-primary) px-4 py-2 text-sm font-medium text-white">
              <IconPlus size={16} stroke={2.5} /> Novo Contato
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: total },
            { label: 'Ativos', value: total - optOuts },
            { label: 'Opt-out', value: optOuts },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{k.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-700 tabular-nums dark:text-slate-200">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <div className="relative max-w-xs min-w-[180px] flex-1">
              <IconSearch size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <div
                data-tour="busca"
                className={`w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${
                  s.foco ? focoCls : ''
                }`}
              >
                {s.busca || (!s.foco && <span className="text-slate-400 dark:text-slate-500">Buscar por nome ou número...</span>)}
                {s.foco && <Caret />}
                {!s.busca && s.foco && <span>&#8203;</span>}
              </div>
            </div>
            <div className="flex items-center gap-6 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              Todos
              <IconChevronDown size={14} className="text-slate-500" />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            {[
              { label: 'Remover duplicados', Icon: IconCopy, red: false },
              { label: 'Limpar inválidos', Icon: IconCircleX, red: false },
              { label: 'Limpar tudo', Icon: IconTrash, red: true },
            ].map(({ label, Icon, red }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                  red
                    ? 'border-red-200 text-red-500 dark:border-red-800 dark:text-red-400'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon size={13} /> {label}
              </div>
            ))}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {['#', 'Nome', 'Número', 'Status', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={corpo} className="divide-y divide-slate-100 dark:divide-slate-700">
              {visiveis.map((c, idx) => (
                <tr
                  key={c.id}
                  data-flip={c.id}
                  className="tour-popup transition-opacity duration-150"
                  style={{ opacity: confere(c, s.busca) ? 1 : 0 }}
                >
                  <td className="w-10 px-5 py-3.5 font-mono text-xs text-slate-400 dark:text-slate-500">{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${corDoNome(c.nome)}`}
                      >
                        {c.nome.charAt(0).toLocaleUpperCase('pt-BR')}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">{c.numero}</td>
                  <td className="px-5 py-3.5">
                    {c.optOut ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <IconBan size={11} stroke={2.5} /> Opt-out
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <IconCheck size={11} stroke={2.5} /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-(--app-primary)">
                        <IconPencil size={13} /> Editar
                      </span>
                      <span
                        data-tour={`optout-${c.id}`}
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          c.optOut ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {c.optOut ? <IconCheck size={13} /> : <IconBan size={13} />}
                        {c.optOut ? 'Reativar' : 'Opt-out'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                        <IconTrash size={13} /> Excluir
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
