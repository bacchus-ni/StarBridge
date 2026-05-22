import { Card } from '../shared/components/Card'
import { PageShell } from '../shared/components/PageShell'

export function AchievementsPage() {
  return (
    <PageShell activePath="/achievements">
      <div className="page-heading">
        <p className="section-label">游戏成就</p>
        <h1>每一次进步，都是你的成长脚印</h1>
      </div>
      <section className="dashboard-grid" aria-label="成就概览">
        <Card>
          <p className="section-label">今日成就</p>
          <h2>等待完成第一个关卡</h2>
          <p>通关后这里会显示今日星星、完成关卡和最佳表现。</p>
        </Card>
        <Card>
          <p className="section-label">情绪徽章墙</p>
          <h2>3 枚徽章</h2>
          <p>句子积木岛、情绪消消乐湖、礼貌语跑酷镇会逐步点亮。</p>
        </Card>
        <Card>
          <p className="section-label">图鉴收集</p>
          <h2>表达卡、情绪卡、礼貌语卡</h2>
          <p>完成关卡后会收集可朗读的能力卡。</p>
        </Card>
        <Card>
          <p className="section-label">伙伴成长</p>
          <h2>星光小鹿正在等你</h2>
          <p>游戏练习和现实练习都会让伙伴获得成长值。</p>
        </Card>
      </section>
    </PageShell>
  )
}
