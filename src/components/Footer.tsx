import { IconBrandWhatsapp } from '@tabler/icons-react'
import { WHATSAPP_CONTATO, WHATSAPP_NUMERO_EXIBICAO } from '@/config/site'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1168px] px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Logo height={20} />
            <span className="text-[13px] text-muted">© 2026 Senderix</span>
          </div>
          <div>
            <h2 className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Contato</h2>
            <a
              href={WHATSAPP_CONTATO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${WHATSAPP_NUMERO_EXIBICAO} (abre em nova aba)`}
              className="group mt-2.5 inline-flex items-center gap-2 text-[14px] font-medium text-fg-strong"
            >
              <IconBrandWhatsapp size={18} stroke={1.75} aria-hidden="true" className="shrink-0 text-whatsapp" />
              <span className="tabular-nums transition-colors group-hover:text-accent-text">{WHATSAPP_NUMERO_EXIBICAO}</span>
            </a>
          </div>
        </div>
        <p className="mt-6 text-[12px] leading-[1.6] text-muted">
          O Senderix não é afiliado ao WhatsApp nem à Meta. WhatsApp é marca registrada da Meta Platforms, Inc.
        </p>
      </div>
    </footer>
  )
}
