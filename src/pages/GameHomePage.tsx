import { Link } from 'react-router-dom'
import { Map, Medal, Sparkles, Star } from 'lucide-react'
import { Button } from '../shared/components/Button'
import { Card } from '../shared/components/Card'
import { PageShell } from '../shared/components/PageShell'

export function GameHomePage() {
  return (
    <PageShell activePath="/game">
      <section className="hero-grid" aria-labelledby="home-title">
        <Card className="buddy-card">
          <div className="buddy-mark" aria-hidden="true">
            <Sparkles size={34} />
          </div>
          <p className="section-label">星桥小助手</p>
          <h1 id="home-title">你好，小探险家</h1>
          <p>
            今天我们一起收集 3 颗星星，练习表达、情绪和礼貌互动。
          </p>
          <Button as={Link} to="/level/sentence-basic-01" icon={<Star size={22} />}>
            开始今日任务
          </Button>
        </Card>

        <Card className="goal-card">
          <p className="section-label">今日目标</p>
          <div className="goal-stars" aria-label="今日目标 3 颗星">
            <Star />
            <Star />
            <Star />
          </div>
          <strong>收集 3 颗星星</strong>
          <span>当前关卡：句子积木岛</span>
        </Card>
      </section>

      <section className="world-layout" aria-labelledby="map-title">
        <Card className="side-rail" aria-label="功能入口">
          <Link className="rail-item is-active" to="/game">
            <Map />
            地图
          </Link>
          <Link className="rail-item" to="/achievements">
            <Medal />
            徽章
          </Link>
          <Link className="rail-item" to="/parent">
            <Sparkles />
            伙伴
          </Link>
        </Card>

        <Card className="map-panel">
          <div className="section-heading">
            <p className="section-label">游戏世界</p>
            <h2 id="map-title">三座表达成长岛屿</h2>
          </div>
          <div className="island-grid">
            <Link className="island-card island-card-primary" to="/level/sentence-basic-01">
              <span className="island-visual blocks" aria-hidden="true" />
              <strong>句子积木岛</strong>
              <span>用词语积木拼出自己的想法</span>
            </Link>
            <Link className="island-card" to="/level/emotion-basic-01">
              <span className="island-visual lake" aria-hidden="true" />
              <strong>情绪消消乐湖</strong>
              <span>认识开心、难过、生气和平静</span>
            </Link>
            <Link className="island-card" to="/level/polite-basic-01">
              <span className="island-visual town" aria-hidden="true" />
              <strong>礼貌语跑酷镇</strong>
              <span>收集请、谢谢和对不起</span>
            </Link>
          </div>
        </Card>

        <Card className="current-level-card">
          <p className="section-label">当前关卡</p>
          <h2>句子积木岛</h2>
          <p>学会友好地表达自己的需求。</p>
          <Button as={Link} to="/level/sentence-basic-01">
            进入关卡
          </Button>
        </Card>
      </section>
    </PageShell>
  )
}
