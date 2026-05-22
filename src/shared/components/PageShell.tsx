import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { Home, Map, Trophy, Users } from 'lucide-react'

const navItems = [
  { to: '/game', label: '游戏世界', icon: Map },
  { to: '/achievements', label: '游戏成就', icon: Trophy },
  { to: '/parent', label: '家长端', icon: Users },
]

type PageShellProps = PropsWithChildren<{
  activePath: '/game' | '/achievements' | '/parent'
}>

export function PageShell({ activePath, children }: PageShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand" to="/game" aria-label="星桥计划首页">
          <span className="brand-mark" aria-hidden="true">
            <Home size={26} />
          </span>
          <span>星桥计划</span>
        </Link>
        <nav className="top-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                className={item.to === activePath ? 'nav-link is-active' : 'nav-link'}
                to={item.to}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
