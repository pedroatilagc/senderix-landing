// Peças compartilhadas das réplicas: sidebar, toasts, modal e campos.
// Classes copiadas dos componentes do app (Tailwind 3 → 4: shadow-sm vira
// shadow-xs, flex-shrink-0 vira shrink-0; `primary` vira a variável --app-primary).

import type { ReactNode } from 'react'
import {
  IconAlertTriangle,
  IconChartBar,
  IconChartDots3,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceMobile,
  IconMessageCircle,
  IconSend,
  IconTemplate,
  IconUsers,
} from '@tabler/icons-react'

export type ItemNav = 'dispositivos' | 'campanhas' | 'automacao' | 'modelos' | 'contatos' | 'relatorios' | 'mensagens'

const NAV = [
  { id: 'dispositivos', label: 'Dispositivos', Icon: IconDeviceMobile },
  { id: 'campanhas', label: 'Campanhas', Icon: IconSend },
  { id: 'automacao', label: 'Automação', Icon: IconChartDots3 },
  { id: 'modelos', label: 'Modelos', Icon: IconTemplate },
  { id: 'contatos', label: 'Contatos', Icon: IconUsers },
  { id: 'relatorios', label: 'Relatórios', Icon: IconChartBar },
  { id: 'mensagens', label: 'Mensagens', Icon: IconMessageCircle },
] as const

const NAV_BASE = 'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150'
const NAV_ATIVO = 'font-semibold bg-blue-100 text-blue-700 dark:bg-blue-600/[0.18] dark:text-blue-400'
const NAV_INATIVO = 'font-medium text-slate-600 dark:text-slate-400'
const ICONE_INATIVO = 'text-slate-400 dark:text-slate-500'

// Versão exibida no rodapé da sidebar (package.json do app)
const VERSAO = '1.0.0'

export const inputCls =
  'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
export const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5'
export const focoCls = 'border-(--app-primary) ring-1 ring-(--app-primary)/20'
export const btnBorda =
  'flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg'

function Sidebar({
  ativo,
  pendentes,
  pulsando,
  recolhida,
}: {
  ativo: ItemNav
  pendentes: number
  pulsando: boolean
  recolhida: boolean
}) {
  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 ${
        recolhida ? 'w-16' : 'w-[240px]'
      }`}
    >
      <nav className="flex-1 overflow-hidden px-2 py-4">
        {!recolhida && (
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest whitespace-nowrap text-slate-400 uppercase dark:text-slate-500">
            Menu
          </p>
        )}
        <ul className="m-0 list-none space-y-1 p-0">
          {NAV.map(({ id, label, Icon }) => {
            const on = id === ativo
            const badge = id === 'mensagens' && pendentes > 0
            return (
              <li key={id}>
                <div className={`${NAV_BASE} ${on ? NAV_ATIVO : NAV_INATIVO}`} data-tour={`nav-${id}`}>
                  <Icon size={17} stroke={on ? 2 : 1.75} className={`shrink-0 ${on ? '' : ICONE_INATIVO}`} />
                  {!recolhida && <span className="overflow-hidden whitespace-nowrap">{label}</span>}
                  {badge && !recolhida && (
                    <span className="relative ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold whitespace-nowrap text-white">
                      {pulsando && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:hidden" />
                      )}
                      <span className="relative">{pendentes}</span>
                    </span>
                  )}
                  {badge && recolhida && (
                    // Variante recolhida do Sidebar.jsx: ponto âmbar pulsante no canto do ícone
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      {pulsando && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 motion-reduce:hidden" />
                      )}
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-slate-100 dark:ring-slate-900" />
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-200 px-2 py-4 dark:border-slate-700">
        <div className="flex w-full items-center justify-center rounded-lg py-2 text-slate-400 dark:text-slate-500">
          {recolhida ? <IconChevronRight size={16} stroke={2} /> : <IconChevronLeft size={16} stroke={2} />}
        </div>
        {!recolhida && (
          <p className="mt-2 text-center text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
            Senderix © 2026 · v{VERSAO}
          </p>
        )}
      </div>
    </aside>
  )
}

/** Layout do app: sidebar + área principal com p-6 */
export function AppShell({
  ativo,
  pendentes = 0,
  pulsando = true,
  recolhida = false,
  children,
  sobreposicoes,
}: {
  ativo: ItemNav
  pendentes?: number
  pulsando?: boolean
  /** Sidebar recolhida (só ícones), estado real do app */
  recolhida?: boolean
  children?: ReactNode
  /** Toasts e modais: posicionados em relação à janela inteira, como os fixed do app */
  sobreposicoes?: ReactNode
}) {
  return (
    <div className="relative flex h-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar ativo={ativo} pendentes={pendentes} pulsando={pulsando} recolhida={recolhida} />
      <main className="relative min-w-0 flex-1 overflow-hidden p-6">{children}</main>
      {sobreposicoes}
    </div>
  )
}

/** Toast de página (sucesso ou erro), canto superior direito */
export function Toast({ on, mensagem, tipo = 'sucesso' }: { on: boolean; mensagem: string; tipo?: 'sucesso' | 'erro' }) {
  return (
    <div
      data-on={on}
      className={`tour-toast absolute top-6 right-6 z-50 flex max-w-md items-center gap-2 rounded-lg px-5 py-3 text-white shadow-lg ${
        tipo === 'sucesso' ? 'bg-emerald-500' : 'bg-red-500'
      }`}
    >
      {tipo === 'sucesso' ? (
        <IconCheck size={18} stroke={2.5} className="shrink-0" />
      ) : (
        <IconAlertTriangle size={18} stroke={2.5} className="shrink-0" />
      )}
      <span className="text-sm font-medium">{mensagem}</span>
    </div>
  )
}

/** ModalWrapper do app: backdrop escuro com blur e painel centralizado */
export function Modal({ on, largura, children }: { on: boolean; largura: number; children: ReactNode }) {
  return (
    <div data-on={on} className="tour-backdrop absolute inset-0 z-[90] flex items-center justify-center p-4">
      <div className="w-full" style={{ maxWidth: largura }}>
        {children}
      </div>
    </div>
  )
}

export function Caret() {
  return <span className="tour-caret" />
}

/** Campo de texto do app: valor ou placeholder, com caret quando focado */
export function Campo({
  valor,
  placeholder,
  focado,
  tour,
  className = '',
  multilinha,
}: {
  valor: string
  placeholder?: string
  focado?: boolean
  tour?: string
  className?: string
  multilinha?: boolean
}) {
  return (
    <div
      data-tour={tour}
      className={`${inputCls} ${focado ? focoCls : ''} ${multilinha ? 'whitespace-pre-wrap break-words' : 'truncate'} ${className}`}
    >
      {valor ? (
        <span>{valor}</span>
      ) : (
        !focado && placeholder && <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
      )}
      {focado && <Caret />}
      {!valor && !multilinha && <span>&#8203;</span>}
    </div>
  )
}
