import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, Map, Users } from 'lucide-react'
import panelArt from '../assets/parent/parent-advice-panel.png'
import parentBg from '../assets/parent/parent-papercraft-bg.png'
import { artAssets } from '../shared/assets/art'
import { useGameStore } from '../shared/store/useGameStore'
import {
  getDeepseekParentAdvice,
  getFallbackParentAdvice,
  getTodaySkillLabels,
  type ParentAdviceResult,
} from '../shared/utils/parentAdvice'

const navItems = [
  { to: '/game', label: '游戏世界', icon: Map },
  { to: '/parent', label: '家长端', icon: Users },
  { to: '/about-autism', label: '了解来自星星的孩子', icon: Info },
]

type AdviceState =
  | { status: 'loading'; content: string; source: 'deepseek' | 'fallback' }
  | { status: 'ready'; content: string; source: 'deepseek' | 'fallback' }

export function ParentPage() {
  const { progress } = useGameStore()
  const skills = useMemo(() => getTodaySkillLabels(progress), [progress])
  const fallbackAdvice = useMemo(() => getFallbackParentAdvice(progress), [progress])
  const [advice, setAdvice] = useState<AdviceState>({
    status: 'loading',
    content: fallbackAdvice,
    source: 'fallback',
  })

  useEffect(() => {
    let isCurrent = true

    setAdvice({ status: 'loading', content: fallbackAdvice, source: 'fallback' })

    getDeepseekParentAdvice(progress)
      .then((result: ParentAdviceResult) => {
        if (!isCurrent) return
        setAdvice({
          status: 'ready',
          content: result.content,
          source: result.source,
        })
      })
      .catch(() => {
        if (!isCurrent) return
        setAdvice({ status: 'ready', content: fallbackAdvice, source: 'fallback' })
      })

    return () => {
      isCurrent = false
    }
  }, [fallbackAdvice, progress])

  return (
    <main
      className="parent-advice-screen"
      style={{ backgroundImage: `url(${parentBg})` }}
    >
      <header className="app-header parent-advice-header">
        <Link className="brand" to="/game" aria-label="星桥计划首页">
          <img className="brand-logo" src={artAssets.logo} alt="" />
        </Link>
        <nav className="top-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                className={item.to === '/parent' ? 'nav-link is-active' : 'nav-link'}
                to={item.to}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <section className="parent-advice-hero" aria-labelledby="parent-advice-title">
        <div className="parent-advice-title-block">
          <h1 id="parent-advice-title">AI 陪练建议</h1>
          <div className="parent-advice-divider" aria-hidden="true">
            <span />
          </div>
        </div>

        <article
          className="parent-advice-paper"
          key={advice.content}
          style={{ backgroundImage: `url(${panelArt})` }}
        >
          <p className="parent-ai-kicker">AI 文字建议</p>

          <section className="parent-advice-section" aria-labelledby="today-skills-title">
            <h2 id="today-skills-title">今日在游戏中学习的技能</h2>
            <ul>
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>

          <hr />

          <section className="parent-advice-section" aria-labelledby="transfer-advice-title">
            <h2 id="transfer-advice-title">现实迁移建议</h2>
            <p aria-busy={advice.status === 'loading'}>{advice.content}</p>
          </section>
        </article>
      </section>
    </main>
  )
}
