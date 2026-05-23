import { Link } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { GameDashboardFrame } from '../features/game-map/GameDashboardFrame'
import { islandArtById } from '../shared/assets/art'
import { islands } from '../shared/data/islands'

export function GameHomePage() {
  return (
    <GameDashboardFrame activeRail="map">
      <section className="world-layout world-layout-map-only home-world-slot" aria-labelledby="map-title">
        <Card className="map-panel">
          <div className="section-heading">
            <p className="section-label">游戏世界</p>
            <h2 id="map-title">三座表达成长岛屿</h2>
          </div>
          <div className="island-grid">
            {islands.map((island, index) => (
              <Link
                className={index === 0 ? 'island-card island-card-primary' : 'island-card'}
                key={island.id}
                to={island.route}
              >
                <img className="island-art" src={islandArtById[island.id]} alt="" />
                <strong>{island.name}</strong>
                <span>{island.description}</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </GameDashboardFrame>
  )
}
