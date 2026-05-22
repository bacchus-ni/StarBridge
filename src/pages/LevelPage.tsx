import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../shared/components/Button'
import { Card } from '../shared/components/Card'
import { PageShell } from '../shared/components/PageShell'

export function LevelPage() {
  const { levelId } = useParams()

  return (
    <PageShell activePath="/game">
      <Button as={Link} to="/game" variant="ghost" icon={<ArrowLeft size={20} />}>
        返回地图
      </Button>
      <Card className="level-shell">
        <p className="section-label">当前关卡</p>
        <h1>{levelId ?? '未知关卡'}</h1>
        <p>下一步会在这里加载对应小游戏，并通过统一 onComplete 回传奖励结果。</p>
      </Card>
    </PageShell>
  )
}
