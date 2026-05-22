import type { ElementType, ReactNode } from 'react'

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
  children: ReactNode
  icon?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Button<T extends ElementType = 'button'>({
  as,
  children,
  icon,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps<T>) {
  const Component = as ?? 'button'
  return (
    <Component className={`button button-${variant} ${className}`.trim()} {...props}>
      {icon ? <span className="button-icon">{icon}</span> : null}
      <span>{children}</span>
    </Component>
  )
}
