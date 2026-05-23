import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { greetingGameArt } from '../../shared/assets/greetingGameArt'
import type { LevelComponentProps } from '../../shared/types/game'
import { createLevelResult } from '../../shared/utils/rewards'
import { speak } from '../../shared/utils/speech'

type GreetingPairId = 'school-hello' | 'ask-help' | 'say-sorry' | 'need-rest'

type GreetingPair = {
  id: GreetingPairId
  scene: string
  phrase: string
  hint: string
  response: string
  spriteClass: string
}

const greetingPairs: GreetingPair[] = [
  {
    id: 'school-hello',
    scene: '早上见到同学',
    phrase: '早上好！',
    hint: '先看见同学在挥手，可以用一句轻松的问候开始互动。',
    response: '早上好！很高兴见到你。',
    spriteClass: 'is-school-hello',
  },
  {
    id: 'ask-help',
    scene: '不会做题',
    phrase: '老师，请问你可以帮帮我吗？',
    hint: '遇到困难时，可以清楚地告诉老师自己需要帮助。',
    response: '老师，请问你可以帮帮我吗？',
    spriteClass: 'is-ask-help',
  },
  {
    id: 'say-sorry',
    scene: '撞到别人',
    phrase: '对不起，我不是故意的。',
    hint: '不小心碰到别人时，先表达歉意，再说明自己不是故意的。',
    response: '对不起，我不是故意的。',
    spriteClass: 'is-say-sorry',
  },
  {
    id: 'need-rest',
    scene: '想安静一下',
    phrase: '我想休息一下。',
    hint: '身体或心里有点累时，可以温和地说出想休息的需要。',
    response: '我想休息一下。',
    spriteClass: 'is-need-rest',
  },
]

const phraseOrder: GreetingPairId[] = ['say-sorry', 'school-hello', 'need-rest', 'ask-help']

const sceneIndexById = new Map<GreetingPairId, number>(
  greetingPairs.map((pair, index) => [pair.id, index]),
)

const phraseIndexById = new Map<GreetingPairId, number>(
  phraseOrder.map((pairId, index) => [pairId, index]),
)

export function FriendlySpeechMatchGame({ levelId, onComplete, onExit }: LevelComponentProps) {
  const navigate = useNavigate()
  const [selectedSceneId, setSelectedSceneId] = useState<GreetingPairId | null>(null)
  const [selectedPhraseId, setSelectedPhraseId] = useState<GreetingPairId | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<GreetingPairId>>(new Set())
  const [mismatchIds, setMismatchIds] = useState<Set<GreetingPairId>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [feedback, setFeedback] = useState('先看发生了什么，再连到合适的友好话语哦。')

  const completedCount = matchedIds.size
  const allMatched = completedCount === greetingPairs.length

  const pairById = useMemo(
    () => new Map<GreetingPairId, GreetingPair>(greetingPairs.map((pair) => [pair.id, pair])),
    [],
  )

  function pickScene(pair: GreetingPair) {
    if (matchedIds.has(pair.id)) {
      setFeedback(`${pair.scene}已经配对完成啦。`)
      return
    }

    setSelectedSceneId(pair.id)
    setMismatchIds(new Set())
    setFeedback(`你选择了“${pair.scene}”，现在去右边找一句合适的话。`)
    speak(pair.scene)

    if (selectedPhraseId) {
      checkMatch(pair.id, selectedPhraseId)
    }
  }

  function pickPhrase(pair: GreetingPair) {
    if (matchedIds.has(pair.id)) {
      setFeedback(`“${pair.phrase}”已经配对完成啦。`)
      return
    }

    setSelectedPhraseId(pair.id)
    setMismatchIds(new Set())
    setFeedback(`你选择了“${pair.phrase}”，看看它适合哪个场景。`)
    speak(pair.phrase)

    if (selectedSceneId) {
      checkMatch(selectedSceneId, pair.id)
    }
  }

  function checkMatch(sceneId: GreetingPairId, phraseId: GreetingPairId) {
    if (sceneId === phraseId) {
      const pair = pairById.get(sceneId)
      const nextMatchedIds = new Set(matchedIds)
      nextMatchedIds.add(sceneId)
      setMatchedIds(nextMatchedIds)
      setSelectedSceneId(null)
      setSelectedPhraseId(null)
      setFeedback(pair ? `连对啦：${pair.response}` : '连对啦。')

      if (pair) {
        speak(pair.response)
      }

      if (nextMatchedIds.size === greetingPairs.length) {
        completeLevel()
      }
      return
    }

    const scenePair = pairById.get(sceneId)
    setMismatchIds(new Set([sceneId, phraseId]))
    setSelectedSceneId(null)
    setSelectedPhraseId(null)
    setFeedback(scenePair ? `我们再试一次。提示：${scenePair.hint}` : '我们再试一次。')
  }

  function applyHint() {
    const nextPair = greetingPairs.find((pair) => !matchedIds.has(pair.id))

    if (!nextPair) {
      setFeedback('已经全部配对完成啦，可以去看看友好徽章。')
      return
    }

    setSelectedSceneId(nextPair.id)
    setSelectedPhraseId(null)
    setMismatchIds(new Set())
    setFeedback(`提示：${nextPair.hint}`)
    speak(nextPair.hint)
  }

  function resetRound() {
    setSelectedSceneId(null)
    setSelectedPhraseId(null)
    setMatchedIds(new Set())
    setMismatchIds(new Set())
    setCompleted(false)
    setFeedback('已经换一组练习状态，我们可以慢慢重新连一次。')
  }

  const phrasePairs = phraseOrder
    .map((pairId) => pairById.get(pairId))
    .filter((pair): pair is GreetingPair => Boolean(pair))

  function completeLevel() {
    if (completed) {
      return
    }

    const result = createLevelResult(levelId)
    if (result) {
      onComplete(result)
    }

    setCompleted(true)
    setFeedback('四组友好话语都连对啦，友好徽章已经点亮。')
  }

  return (
    <main
      className="greeting-game-screen"
      style={
        {
          backgroundImage: `url(${greetingGameArt.bg})`,
          '--greeting-scenes': `url(${greetingGameArt.scenes})`,
        } as CSSProperties
      }
    >
      <div className="greeting-game-stage">
        <button className="greeting-back-button" type="button" onClick={onExit}>
          返回地图
        </button>

        <header className="greeting-game-header">
          <div className="greeting-island-wrap">
            <img className="greeting-island-badge" src={greetingGameArt.island} alt="" />
            <strong>问候岛</strong>
          </div>
          <div className="greeting-title-paper">
            <h1>友好话语连连看</h1>
            <p>看看场景，连到合适的话语</p>
          </div>
          <div className="greeting-helper">
            <img src={greetingGameArt.helperDeer} alt="" />
            <p>先看发生了什么，再连到合适的友好话语哦！</p>
          </div>
        </header>

        <section className="greeting-main-panel" aria-label="友好话语连连看">
          <div className="greeting-match-board">
            <div className="greeting-column" aria-label="场景">
              {greetingPairs.map((pair, index) => (
                <button
                  className={`greeting-scene-card ${pair.spriteClass} ${
                    selectedSceneId === pair.id ? 'is-selected' : ''
                  } ${matchedIds.has(pair.id) ? 'is-matched' : ''} ${
                    mismatchIds.has(pair.id) ? 'is-mismatch' : ''
                  }`}
                  key={pair.id}
                  type="button"
                  onClick={() => pickScene(pair)}
                >
                  <span className="greeting-scene-image" aria-hidden="true" />
                  <span className="greeting-index">{index + 1}</span>
                  <strong>{pair.scene}</strong>
                </button>
              ))}
            </div>

            <div className="greeting-connection-column" aria-hidden="true">
              <svg className="greeting-connector-svg" viewBox="0 0 100 400" preserveAspectRatio="none">
                {greetingPairs.map((pair) => {
                  if (!matchedIds.has(pair.id)) {
                    return null
                  }

                  const sceneIndex = sceneIndexById.get(pair.id) ?? 0
                  const phraseIndex = phraseIndexById.get(pair.id) ?? 0

                  return (
                    <line
                      className="greeting-connector-line"
                      key={pair.id}
                      x1="0"
                      x2="100"
                      y1={sceneIndex * 100 + 50}
                      y2={phraseIndex * 100 + 50}
                    />
                  )
                })}
              </svg>
            </div>

            <div className="greeting-column" aria-label="友好话语">
              {phrasePairs.map((pair, index) => (
                <button
                  className={`greeting-phrase-card ${
                    selectedPhraseId === pair.id ? 'is-selected' : ''
                  } ${matchedIds.has(pair.id) ? 'is-matched' : ''} ${
                    mismatchIds.has(pair.id) ? 'is-mismatch' : ''
                  }`}
                  key={pair.id}
                  type="button"
                  onClick={() => pickPhrase(pair)}
                >
                  <span className="greeting-index">{index + 1}</span>
                  <strong>{pair.phrase}</strong>
                </button>
              ))}
            </div>
          </div>

          <p className="greeting-feedback" aria-live="polite">
            {feedback}
          </p>

          <div className="greeting-actions">
            <button className="greeting-art-button is-hint" type="button" onClick={applyHint}>
              提示
            </button>
            <button className="greeting-art-button is-refresh" type="button" onClick={resetRound}>
              换一组
            </button>
            {allMatched ? (
              <Button variant="secondary" onClick={() => navigate('/achievements')}>
                查看徽章
              </Button>
            ) : null}
          </div>
        </section>

        <aside className="greeting-reward-panel" aria-label="友好徽章奖励">
          <div className="greeting-ribbon">友好徽章</div>
          <img className="greeting-big-badge" src={greetingGameArt.badge} alt="" />
          <div className="greeting-progress-card">
            <strong>已完成配对</strong>
            <div className="greeting-flower-list" aria-label={`已完成 ${completedCount} 组`}>
              {greetingPairs.map((pair) => (
                <span className={matchedIds.has(pair.id) ? 'is-earned' : ''} key={pair.id}>
                  ✿
                </span>
              ))}
            </div>
            <p>{completedCount} / 4 组</p>
          </div>
          <p className="greeting-listen-note">
            {completed
              ? '问候岛通关啦，友好徽章已经进入成就页。'
              : '连对 4 组，获得友好徽章。'}
          </p>
        </aside>
      </div>
    </main>
  )
}
