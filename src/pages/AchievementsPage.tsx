import { BadgeWall } from '../features/achievements/BadgeWall'
import { GameDashboardFrame } from '../features/game-map/GameDashboardFrame'

export function AchievementsPage() {
  return (
    <GameDashboardFrame activeRail="achievements">
      <section
        className="world-layout world-layout-map-only home-world-slot"
        aria-labelledby="achievements-title"
      >
        <BadgeWall />
      </section>
    </GameDashboardFrame>
  )
}
