'use client'

// Réplica de pages/Mensagens.jsx com os avisos globais do components/Layout.jsx
// (toast âmbar de atendimento e badge pulsante na sidebar).

import { useRef } from 'react'
import {
  IconCheck,
  IconChevronDown,
  IconClock,
  IconDeviceMobile,
  IconHeadset,
  IconInbox,
  IconLoader,
  IconMessageCircle,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'
import { MENSAGENS, MENSAGEM_NOVA, type Mensagem } from '../data'
import { AppShell, Modal, Toast, btnBorda } from '../ui'
import { useFlip } from '../useFlip'
import { useEstadoTela, useTimeline, type Roteiro, type TelaProps } from '../useTimeline'

type Estado = {
  mensagens: Mensagem[]
  novoId: number | null
  aba: 'todas' | 'aguardando'
  toastAtend: boolean
  pendentes: number
  modal: boolean
  marcando: boolean
  toast: boolean
}

const INICIAL: Estado = {
  mensagens: MENSAGENS,
  novoId: null,
  aba: 'todas',
  toastAtend: false,
  pendentes: 0,
  modal: false,
  marcando: false,
  toast: false,
}

const FINAL: Estado = {
  ...INICIAL,
  mensagens: [{ ...MENSAGEM_NOVA, aguardando: false }, ...MENSAGENS],
  toast: true,
}

const COLUNAS = ['Nome', 'Número', 'Dispositivo', 'Mensagem', 'Recebido em', 'Atendimento']

export default function AtendimentoScreen({ ativo, chave, estatico, aoTerminar }: TelaProps) {
  const [s, set, reiniciar] = useEstadoTela(INICIAL, FINAL, estatico)
  const corpo = useRef<HTMLTableSectionElement>(null)
  useFlip(corpo, estatico)

  const roteiro: Roteiro = async (t) => {
    await t.esperar(900)
    // Mensagem nova de quem chegou ao bloco de transferência: entra no topo da tabela
    set((e) => ({ mensagens: [MENSAGEM_NOVA, ...e.mensagens], novoId: MENSAGEM_NOVA.id }))
    await t.esperar(450)
    set({ toastAtend: true, pendentes: 1 })
    await t.esperar(2050)
    set({ novoId: null })
    await t.esperar(400)

    await t.clicar('toast-atendimento')
    set({ toastAtend: false })
    await t.esperar(350)
    await t.clicar('aba-aguardando')
    set({ aba: 'aguardando' })
    await t.esperar(700)

    await t.clicar('marcar-atendido')
    set({ modal: true })
    await t.esperar(1100)
    await t.clicar('modal-confirmar')
    set({ marcando: true })
    await t.esperar(650)
    set((e) => ({
      modal: false,
      marcando: false,
      toast: true,
      pendentes: 0,
      mensagens: e.mensagens.map((m) => ({ ...m, aguardando: false })),
    }))
    await t.esperar(1400)
    await t.clicar('aba-todas')
    set({ aba: 'todas' })
  }

  useTimeline({ roteiro, reiniciar, ativo: ativo && !estatico, chave, aoTerminar })

  const aguardando = s.mensagens.filter((m) => m.aguardando).length
  const filtradas = s.aba === 'aguardando' ? s.mensagens.filter((m) => m.aguardando) : s.mensagens
  const pendente = s.mensagens.find((m) => m.aguardando) ?? MENSAGEM_NOVA

  return (
    <AppShell
      ativo="mensagens"
      pendentes={s.pendentes}
      // A tabela de Mensagens tem 6 colunas: com a sidebar aberta, numa janela de
      // 1280px, a coluna de atendimento passa da borda (no app também)
      recolhida
      sobreposicoes={
        <>
          <Modal on={s.modal} largura={420}>
            <div className="w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <IconHeadset size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-100">Confirmar atendimento</h3>
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-200">
                <strong>{pendente.nome}</strong>
                <span className="ml-1.5 font-mono text-xs text-slate-400 dark:text-slate-500">{pendente.numero}</span>
                <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-400">Aguardando agora</span>
              </p>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                Confirme que você já respondeu este contato. Ele deixará de aparecer como aguardando atendimento.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Cancelar
                </div>
                <div
                  data-tour="modal-confirmar"
                  className={`flex flex-[1.6] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white ${
                    s.marcando ? 'opacity-50' : ''
                  }`}
                >
                  {s.marcando ? <IconLoader size={16} className="animate-spin" /> : <IconCheck size={16} stroke={2.5} />}
                  {s.marcando ? 'Marcando...' : 'Já respondi, marcar como atendido'}
                </div>
              </div>
            </div>
          </Modal>

          <Toast on={s.toast} mensagem="Atendimento marcado como concluído." />

          {/* Toast global de atendimento (Layout.jsx), canto inferior direito */}
          <div className="absolute right-6 bottom-6 z-50">
            <div
              data-on={s.toastAtend}
              data-tour="toast-atendimento"
              className="tour-toast flex w-80 items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 shadow-xl dark:border-amber-800 dark:bg-amber-950"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <IconHeadset size={18} stroke={2} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {MENSAGEM_NOVA.nome} pediu atendimento
                </p>
                <p className="truncate text-xs text-amber-700 dark:text-amber-300/80">Fluxo: Recepção</p>
                <p className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">Clique para ver mensagens →</p>
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Mensagens</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Mensagens recebidas em tempo real</p>
          </div>
          <div className={btnBorda}>
            <IconRefresh size={15} />
            Atualizar
          </div>
        </div>

        <div className="grid max-w-lg grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-200">{s.mensagens.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Últimas 24h</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{s.mensagens.length}</p>
          </div>
          <div
            className={`rounded-xl border p-4 transition-colors duration-300 ${
              aguardando > 0
                ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <p
              className={`text-xs font-medium tracking-wide uppercase ${
                aguardando > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Aguardando atendimento
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                aguardando > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {aguardando}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { id: 'todas', label: 'Todas', badge: 0 },
                { id: 'aguardando', label: 'Aguardando', badge: aguardando },
              ] as const
            ).map((a) => (
              <div
                key={a.id}
                data-tour={`aba-${a.id}`}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                  s.aba === a.id
                    ? 'bg-white text-slate-800 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {a.label}
                {a.badge > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{a.badge}</span>
                )}
              </div>
            ))}
          </div>
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <IconSearch size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <div className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              Buscar por nome, número ou mensagem...
            </div>
          </div>
          <div className="flex items-center gap-6 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            Todos os dispositivos
            <IconChevronDown size={14} className="text-slate-500" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <IconMessageCircle size={16} stroke={2} className="text-violet-500 dark:text-violet-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mensagens Recebidas</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {filtradas.length} {filtradas.length === 1 ? 'mensagem' : 'mensagens'}
            </span>
          </div>

          {filtradas.length === 0 ? (
            <div className="tour-popup flex flex-col items-center justify-center gap-3 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <IconInbox size={28} stroke={1.25} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Ninguém aguardando atendimento</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400 dark:text-slate-500">
                  Contatos que chegarem a um bloco de transferência aparecem aqui.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  {COLUNAS.map((h) => (
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
                {filtradas.map((m) => (
                  <tr
                    key={m.id}
                    data-flip={m.id}
                    className={`transition-colors duration-700 ${
                      s.novoId === m.id
                        ? 'tour-entra bg-emerald-50 dark:bg-emerald-900/20'
                        : m.aguardando
                          ? 'bg-amber-50/70 dark:bg-amber-900/15'
                          : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                          <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                            {m.nome[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.nome}</span>
                        {m.aguardando && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <IconHeadset size={11} stroke={2.5} /> Aguardando atendimento
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {m.numero}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
                        <IconDeviceMobile size={11} stroke={2.5} />
                        {m.dispositivo}
                      </span>
                    </td>
                    <td className="max-w-[300px] px-5 py-3.5">
                      {m.mensagem ? (
                        <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{m.mensagem}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic dark:text-slate-500">[mídia]</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
                        <IconClock size={12} stroke={2} />
                        {m.recebido}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {m.aguardando && (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[11px] whitespace-nowrap text-amber-700 dark:text-amber-400">Espera agora</span>
                          <div
                            data-tour="marcar-atendido"
                            className="flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-emerald-700 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400"
                          >
                            <IconCheck size={12} stroke={2.5} />
                            Marcar como atendido
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
