import { Card } from '../../shared/components/Card'
import { ProgressBar } from '../../shared/components/ProgressBar'
import { badgeArtById } from '../../shared/assets/badgeArt'
import { badges } from '../../shared/data/badges'
import { useGameStore } from '../../shared/store/useGameStore'

export function BadgeWall() {
  const { progress } = useGameStore()

  return (
    <Card className="map-panel achievement-badge-panel">
      <div className="section-heading">
        <p className="section-label">游戏成就</p>
        <h2 id="achievements-title">四枚成长徽章</h2>
        <span>每通关一个游戏，徽章就会从黑白变成彩色。</span>
      </div>
      <div className="game-badge-grid">
        {badges.map((badge) => {
          const value = progress.badgeProgress[badge.id] ?? 0
          const unlocked = value >= 3

          return (
            <article
              aria-label={`${badge.name}${unlocked ? '已通关' : `进度 ${value}/3`}`}
              className={unlocked ? 'game-badge-card is-unlocked' : 'game-badge-card'}
              key={badge.id}
            >
              <div className="game-badge-art-frame">
                <img
                  className="game-badge-art"
                  src={badgeArtById[badge.id]}
                  alt={`${badge.name}${unlocked ? '已点亮' : '未点亮'}`}
                />
              </div>
              <div className="game-badge-progress">
                <ProgressBar label={badge.name} max={3} value={value} />
                <b>{unlocked ? '已通关' : `${value}/3`}</b>
              </div>
            </article>
          )
        })}
      </div>
    </Card>
  )
}
