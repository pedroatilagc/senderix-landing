import { WHATSAPP_LINK } from '@/config/site'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1168px] px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex items-center gap-4">
            <Logo height={20} />
            <span className="text-[13px] text-muted">© 2026 Senderix</span>
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-fg-strong transition-colors hover:text-accent-text"
          >
            Falar com a gente
          </a>
        </div>
        <p className="mt-6 text-[12px] leading-[1.6] text-muted">
          O Senderix não é afiliado ao WhatsApp nem à Meta. WhatsApp é marca registrada da Meta Platforms, Inc.
        </p>
      </div>
    </footer>
  )
}
