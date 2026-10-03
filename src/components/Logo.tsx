import { getImageProps } from 'next/image'

// Proporção dos PNGs recortados (945×216 e 389×89): ~4,37:1
const RATIO = 945 / 216

type Props = {
  /** Altura máxima em que o logo aparece; define a resolução gerada */
  height?: number
  preload?: boolean
  /** Tamanho responsivo; quando ausente, usa a altura fixa */
  className?: string
}

export function Logo({ height = 28, preload = false, className }: Props) {
  const width = Math.round(height * RATIO)
  const common = { alt: 'Senderix', width, height }
  const {
    props: { srcSet: dark },
  } = getImageProps({ ...common, src: '/logo/senderix-dark.png' })
  const {
    props: { srcSet: light, ...rest },
  } = getImageProps({ ...common, src: '/logo/senderix-light.png' })

  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={dark} />
      <source media="(prefers-color-scheme: light)" srcSet={light} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt vem de getImageProps */}
      <img
        {...rest}
        fetchPriority={preload ? 'high' : undefined}
        className={className}
        style={className ? undefined : { width, height }}
      />
    </picture>
  )
}
