import { IconCheck } from '@tabler/icons-react'
import { PLANOS, RECURSOS_BASE, WHATSAPP_LINK, isPendente, type Plano } from '@/config/site'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const rotuloFluxos = (f: Plano['fluxos']) => (f === null ? 'Ilimitados' : String(f))

// Rótulo e valor juntos leem: "Computadores: Até 2" (curto para não quebrar linha no cartão)
const rotuloComputadores = (n: Plano['computadores']) => (n === 1 ? 'Computador' : 'Computadores')
const valorComputadores = (n: Plano['computadores']) => (n === null ? 'Sob medida' : `Até ${n}`)

function Cta({ plano }: { plano: Plano }) {
  const href = plano.checkout ?? WHATSAPP_LINK
  const classe = plano.destaque ? 'btn btn-primary w-full' : 'btn btn-outline w-full'

  // Link de checkout ainda não configurado: nunca levar a uma página quebrada
  if (isPendente(href) && process.env.NODE_ENV === 'production') {
    return (
      <span role="link" aria-disabled="true" className="btn btn-disabled w-full">
        Em breve
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classe}
      aria-label={plano.checkout ? `${plano.cta} (abre em nova aba)` : undefined}
    >
      {plano.cta}
    </a>
  )
}

function Cartao({ plano }: { plano: Plano }) {
  // Selo fora do destaque vira aba presa atrás da borda superior do cartão
  const temAba = Boolean(plano.selo) && !plano.destaque

  return (
    <article
      aria-labelledby={`plano-${plano.id}`}
      className={`relative row-span-6 grid grid-rows-subgrid gap-0 rounded-xl border p-6 ${
        plano.destaque ? 'border-accent' : 'border-line'
      } ${temAba ? 'max-md:mt-10' : ''}`}
    >
      {temAba && (
        // Aba "atrás da folha": 28px visíveis acima do cartão e 10px escondidos sob ele.
        // z negativo funciona porque a grade tem `isolate`; o cartão tem fundo opaco.
        <span className="card-tab absolute -top-7 left-3 -z-10 flex h-[38px] items-start rounded-t-xl border border-b-0 border-line bg-subtle px-3 text-[12px] font-medium whitespace-nowrap text-muted">
          <span className="flex h-7 items-center">{plano.selo}</span>
        </span>
      )}
      <div className="flex items-center justify-between gap-3">
        <h3
          id={`plano-${plano.id}`}
          className={`text-[13px] font-semibold tracking-[0.08em] uppercase ${
            plano.destaque ? 'text-accent-text' : 'text-muted'
          }`}
        >
          {plano.nome}
        </h3>
        {plano.selo && plano.destaque && (
          <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[12px] font-medium text-accent-text">
            {plano.selo}
          </span>
        )}
      </div>

      <p className="mt-3 text-[15px] leading-[1.5] text-fg">{plano.frase}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        {plano.preco === null ? (
          <span className="text-[2rem] leading-none font-medium tracking-[-0.02em] text-fg-strong">Sob consulta</span>
        ) : (
          <>
            <span className="text-[2rem] leading-none font-medium tracking-[-0.02em] text-fg-strong tabular-nums">
              {brl.format(plano.preco)}
            </span>
            <span className="text-sm text-muted">/mês</span>
          </>
        )}
      </p>

      <div className="mt-6">
        <Cta plano={plano} />
      </div>

      <dl className="mt-6 divide-y divide-line border-y border-line text-[14px]">
        <div className="flex items-center justify-between py-2.5">
          <dt className="pr-3 text-accent-text">WhatsApps conectados</dt>
          <dd className="font-mono text-[13px] whitespace-nowrap text-fg-strong">{plano.numeros}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="pr-3 text-accent-text">Fluxos ativos</dt>
          <dd className="font-mono text-[13px] whitespace-nowrap text-fg-strong">{rotuloFluxos(plano.fluxos)}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="pr-3 text-accent-text">{rotuloComputadores(plano.computadores)}</dt>
          <dd className="font-mono text-[13px] whitespace-nowrap text-fg-strong">
            {valorComputadores(plano.computadores)}
          </dd>
        </div>
      </dl>

      <ul className="mt-6 space-y-2.5 text-[14px] leading-[1.45] text-fg">
        {[...RECURSOS_BASE, ...plano.extras].map((item, i) => (
          <li
            key={item}
            className={`flex gap-2.5 ${i === RECURSOS_BASE.length ? 'border-t border-line pt-3.5' : ''}`}
          >
            <IconCheck size={16} stroke={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
            <span className={i >= RECURSOS_BASE.length ? 'font-medium text-fg-strong' : undefined}>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function Pricing() {
  return (
    <section
      id="planos"
      aria-labelledby="planos-titulo"
      className="scroll-mt-16 border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-[1168px] px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-[40rem]">
          <h2 id="planos-titulo" className="text-[2rem] leading-[1.15] font-normal tracking-[-0.02em] text-fg-strong sm:text-[2.5rem]">
            Planos simples, sem surpresa
          </h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-muted">
            Escolha pelo número de WhatsApps conectados. Todos os planos têm as mesmas funcionalidades.
          </p>
        </div>

        {/* No 2×2 a segunda linha desce junto, para a aba do Enterprise não encostar no Gold
            sem desalinhar o Platinum ao lado */}
        <div className="isolate mt-14 grid gap-x-4 gap-y-0 md:grid-cols-2 lg:grid-cols-4 [&>article]:mb-4 [&>article]:bg-bg md:max-lg:[&>article:nth-child(n+3)]:mt-6 lg:[&>article]:mb-0">
          {PLANOS.map((p) => (
            <Cartao key={p.id} plano={p} />
          ))}
        </div>

        <div className="mt-8 space-y-1.5 text-[14px] text-muted">
          <p>Crie quantos fluxos quiser. O limite vale apenas para fluxos ativos ao mesmo tempo.</p>
          <p>Troque de computador quando quiser: é só desconectar o antigo.</p>
          <p>
            Precisa de mais um número?{' '}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-text underline decoration-1 underline-offset-4"
            >
              Fale com a gente
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
