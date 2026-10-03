import { IconArrowRight } from '@tabler/icons-react'
import { WHATSAPP_LINK } from '@/config/site'
import { FlowIllustration } from './FlowIllustration'

export function Hero() {
  return (
    <section id="topo" className="mx-auto max-w-[1168px] px-4 pt-28 pb-20 sm:px-6 sm:pt-36 sm:pb-28">
      <div className="grid items-center gap-12 min-[1200px]:grid-cols-[minmax(0,1fr)_586px]">
        <div className="max-w-[600px]">
          <p className="inline-flex items-center rounded-full border border-line px-3 py-1 font-mono text-[12px] text-muted">
            Automação de atendimento para WhatsApp
          </p>
          <h1 className="mt-6 text-[2.25rem] leading-[1.08] font-normal tracking-[-0.025em] text-balance text-fg-strong sm:text-[3.25rem] min-[1200px]:text-[2.75rem]">
            Seu WhatsApp responde sozinho. <span className="text-muted">Sua equipe atende só quem precisa.</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-muted sm:text-lg">
            Monte fluxos com menus e respostas automáticas, encaminhe para um atendente quando for preciso e dispare
            campanhas com o próprio atendimento já pronto.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a href="#planos" className="btn btn-primary">
              Ver planos
            </a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="link-arrow text-[15px]">
              Falar com a gente
              <IconArrowRight size={16} stroke={2} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[586px]">
          <FlowIllustration />
        </div>
      </div>
    </section>
  )
}
