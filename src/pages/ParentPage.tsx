import { Card } from '../shared/components/Card'
import { PageShell } from '../shared/components/PageShell'

export function ParentPage() {
  return (
    <PageShell activePath="/parent">
      <div className="page-heading">
        <p className="section-label">家长端</p>
        <h1>游戏中学习，生活中成长</h1>
      </div>
      <section className="dashboard-grid" aria-label="家长端概览">
        <Card>
          <p className="section-label">今日学习摘要</p>
          <h2>完成关卡后生成</h2>
          <p>这里会把孩子今天练过的能力翻译成家长能理解的语言。</p>
        </Card>
        <Card>
          <p className="section-label">AI 陪练建议</p>
          <h2>本地 fallback 模板</h2>
          <p>Demo 阶段先用稳定模板生成现实练习建议，后续可接真实 AI。</p>
        </Card>
        <Card>
          <p className="section-label">家长反馈</p>
          <h2>已练习 / 待练习</h2>
          <p>家长打卡后，现实练习会回流为伙伴特别成长。</p>
        </Card>
      </section>
    </PageShell>
  )
}
