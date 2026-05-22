import type { HTMLAttributes, PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <article className={`paper-card ${className}`.trim()} {...props}>
      {children}
    </article>
  )
}
