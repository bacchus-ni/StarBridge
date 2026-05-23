import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lightbulb, RotateCcw } from 'lucide-react'
import { Button } from '../../shared/components/Button'
import { sentenceGameArt } from '../../shared/assets/sentenceGameArt'
import { useGameStore } from '../../shared/store/useGameStore'
import type { Difficulty, LevelComponentProps } from '../../shared/types/game'
import { speak } from '../../shared/utils/speech'
import { createLevelResult } from '../../shared/utils/rewards'
import {
  loadSentenceProgressFile,
  saveSentenceCompletionRecord,
  type SentenceProgressFile,
} from '../../shared/services/sentenceProgressFile'

type BlockKind = 'person' | 'expression' | 'object'

type BlockOption = {
  id: string
  kind: BlockKind
  label: string
  image: string
}

type SentenceLevelId = (typeof sentenceLevelOrder)[number]

type SentenceRound = {
  id: SentenceLevelId
  order: number
  title: string
  difficulty: Difficulty
  difficultyLabel: string
  prompt: string
  target: Record<BlockKind, string>
  optionIds: Record<BlockKind, string[]>
  encouragement: string
}

const sentenceLevelOrder = [
  'sentence-basic-01',
  'sentence-medium-01',
  'sentence-advanced-01',
] as const

const people: BlockOption[] = [
  { id: 'me', kind: 'person', label: '我', image: sentenceGameArt.tiles.boy },
  { id: 'mom', kind: 'person', label: '妈妈', image: sentenceGameArt.tiles.mom },
  { id: 'teacher', kind: 'person', label: '老师', image: sentenceGameArt.tiles.teacher },
  { id: 'friend', kind: 'person', label: '小朋友', image: sentenceGameArt.tiles.friend },
]

const expressions: BlockOption[] = [
  { id: 'want', kind: 'expression', label: '想要', image: sentenceGameArt.tiles.wantWater },
  { id: 'no', kind: 'expression', label: '不要', image: sentenceGameArt.tiles.noThanks },
  { id: 'more', kind: 'expression', label: '还要', image: sentenceGameArt.tiles.plate },
]

const objects: BlockOption[] = [
  { id: 'rice', kind: 'object', label: '饭', image: sentenceGameArt.tiles.rice },
  { id: 'water', kind: 'object', label: '水', image: sentenceGameArt.tiles.water },
  { id: 'spoon', kind: 'object', label: '勺子', image: sentenceGameArt.tiles.spoon },
  { id: 'veggies', kind: 'object', label: '青菜', image: sentenceGameArt.tiles.veggies },
  { id: 'cookies', kind: 'object', label: '饼干', image: sentenceGameArt.tiles.cookies },
]

const optionGroups = [
  { kind: 'person' as const, label: '人物积木', tone: 'blue', options: people },
  { kind: 'expression' as const, label: '表达积木', tone: 'green', options: expressions },
  { kind: 'object' as const, label: '食物和餐具积木', tone: 'coral', options: objects },
]

const roundsByLevel: Record<SentenceLevelId, SentenceRound> = {
  'sentence-basic-01': {
    id: 'sentence-basic-01',
    order: 1,
    title: '我想要水',
    difficulty: 'basic',
    difficultyLabel: '简单',
    prompt: '只从少量积木里找出“我想要水”。',
    target: { person: 'me', expression: 'want', object: 'water' },
    optionIds: {
      person: ['me', 'mom'],
      expression: ['want', 'no'],
      object: ['water', 'cookies', 'rice'],
    },
    encouragement: '第一颗表达星点亮！你清楚地说出了“我想要水”。',
  },
  'sentence-medium-01': {
    id: 'sentence-medium-01',
    order: 2,
    title: '我还要饼干',
    difficulty: 'medium',
    difficultyLabel: '进阶',
    prompt: '积木变多了，请拼出“我还要饼干”。',
    target: { person: 'me', expression: 'more', object: 'cookies' },
    optionIds: {
      person: ['me', 'mom', 'teacher', 'friend'],
      expression: ['want', 'no', 'more'],
      object: ['water', 'spoon', 'cookies', 'rice'],
    },
    encouragement: '第二颗表达星点亮！你会用“还要”表达继续需要。',
  },
  'sentence-advanced-01': {
    id: 'sentence-advanced-01',
    order: 3,
    title: '我不要青菜',
    difficulty: 'advanced',
    difficultyLabel: '挑战',
    prompt: '选项最多，请温和地拼出“我不要青菜”。',
    target: { person: 'me', expression: 'no', object: 'veggies' },
    optionIds: {
      person: ['me', 'mom', 'teacher', 'friend'],
      expression: ['want', 'no', 'more'],
      object: ['rice', 'water', 'spoon', 'veggies', 'cookies'],
    },
    encouragement: '三颗表达星集齐！你能把想要和不想要都说清楚了。',
  },
}

const kindLabels: Record<BlockKind, string> = {
  person: '先选谁',
  expression: '再选怎么说',
  object: '最后选什么',
}

export function SentenceBlocksGame({ levelId, onComplete, onExit }: LevelComponentProps) {
  const navigate = useNavigate()
  const { progress } = useGameStore()
  const activeLevelId = isSentenceLevelId(levelId) ? levelId : 'sentence-basic-01'
  const round = roundsByLevel[activeLevelId]
  const [selected, setSelected] = useState<Partial<Record<BlockKind, string>>>({})
  const [hintCount, setHintCount] = useState(0)
  const [justCompleted, setJustCompleted] = useState(false)
  const [feedback, setFeedback] = useState(round.prompt)
  const [fileProgress, setFileProgress] = useState<SentenceProgressFile | null>(null)
  const [saveStatus, setSaveStatus] = useState('完成后会保存到 local-data/sentence-progress.json')

  useEffect(() => {
    let cancelled = false

    loadSentenceProgressFile().then((nextProgress) => {
      if (!cancelled) {
        setFileProgress(nextProgress)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const fileCompletedIds = useMemo(
    () => new Set(fileProgress?.completedLevelIds ?? []),
    [fileProgress],
  )
  const completedSentenceIds = useMemo(
    () =>
      new Set(
        sentenceLevelOrder.filter(
          (id) => progress.completedLevelIds.includes(id) || fileCompletedIds.has(id),
        ),
    ),
    [fileCompletedIds, progress.completedLevelIds],
  )
  const displayedCompletedIds = useMemo(() => {
    const nextIds = new Set(completedSentenceIds)
    if (justCompleted) {
      nextIds.add(activeLevelId)
    }

    return nextIds
  }, [activeLevelId, completedSentenceIds, justCompleted])

  const currentLevelCompleted = displayedCompletedIds.has(activeLevelId)
  const expressionStars = Math.min(3, displayedCompletedIds.size)
  const nextLevelId = sentenceLevelOrder[round.order]

  const visibleGroups = useMemo(
    () =>
      optionGroups.map((group) => ({
        ...group,
        options: group.options.filter((option) => round.optionIds[group.kind].includes(option.id)),
      })),
    [round],
  )

  const selectedOptions = useMemo(
    () => ({
      person: findOption('person', selected.person),
      expression: findOption('expression', selected.expression),
      object: findOption('object', selected.object),
    }),
    [selected],
  )

  const targetSentence = useMemo(() => {
    const person = findOption('person', round.target.person)?.label ?? ''
    const expression = findOption('expression', round.target.expression)?.label ?? ''
    const object = findOption('object', round.target.object)?.label ?? ''
    return `${person}${expression}${object}。`
  }, [round])

  const currentSentence = [
    selectedOptions.person?.label,
    selectedOptions.expression?.label,
    selectedOptions.object?.label,
  ].every(Boolean)
    ? `${selectedOptions.person?.label}${selectedOptions.expression?.label}${selectedOptions.object?.label}。`
    : targetSentence

  const isTarget =
    selected.person === round.target.person &&
    selected.expression === round.target.expression &&
    selected.object === round.target.object

  function pick(option: BlockOption) {
    setSelected((current) => ({ ...current, [option.kind]: option.id }))
    setJustCompleted(false)
    setFeedback(`${kindLabels[option.kind]}：${option.label}`)
  }

  function applyHint() {
    const nextKind = (['person', 'expression', 'object'] as BlockKind[]).find(
      (kind) => selected[kind] !== round.target[kind],
    )

    if (!nextKind) {
      setFeedback('已经拼对啦，可以点亮表达星。')
      return
    }

    setSelected((current) => ({ ...current, [nextKind]: round.target[nextKind] }))
    setHintCount((count) => count + 1)
    setFeedback(`提示：${kindLabels[nextKind]}，试试“${findOption(nextKind, round.target[nextKind])?.label}”。`)
  }

  function shufflePreset() {
    const optionIds = round.optionIds
    const presets: Array<Record<BlockKind, string>> = [
      {
        person: 'me',
        expression: optionIds.expression.includes('no') ? 'no' : optionIds.expression[0],
        object: optionIds.object.includes('veggies') ? 'veggies' : optionIds.object[0],
      },
      {
        person: 'me',
        expression: optionIds.expression.includes('more') ? 'more' : optionIds.expression[0],
        object: optionIds.object.includes('cookies') ? 'cookies' : optionIds.object[0],
      },
      round.target,
    ]
    const preset = presets[(hintCount + 1) % presets.length]
    setSelected(preset)
    setHintCount((count) => count + 1)
    setJustCompleted(false)
    setFeedback('换了一组句子积木，读一读看看意思变了吗？')
  }

  async function finishRound() {
    if (!isTarget) {
      setFeedback(`目标句子是“${targetSentence}”，我们再调一调积木。`)
      return
    }

    const completedAt = new Date().toISOString()
    const record = {
      levelId: round.id,
      levelTitle: round.title,
      difficulty: round.difficulty,
      sentence: targetSentence,
      selectedLabels: [
        selectedOptions.person?.label,
        selectedOptions.expression?.label,
        selectedOptions.object?.label,
      ].filter(Boolean) as string[],
      expressionStarsEarned: 1 as const,
      completedAt,
    }

    setJustCompleted(true)
    setFeedback(round.encouragement)
    setSaveStatus('正在保存本地完成记录...')

    const result = createLevelResult(activeLevelId)
    if (result) {
      onComplete(result)
    }

    const saveResult = await saveSentenceCompletionRecord(record)
    setFileProgress(saveResult.progress)
    setSaveStatus(
      saveResult.mode === 'file'
        ? '已保存到 local-data/sentence-progress.json'
        : '本地文件接口不可用，已暂存到浏览器本地记录',
    )
  }

  return (
    <main className="sentence-game-screen" style={{ backgroundImage: `url(${sentenceGameArt.bg})` }}>
      <div className="sentence-game-stage">
        <button className="sentence-back-button" type="button" onClick={onExit}>
          <ArrowLeft size={20} />
          返回地图
        </button>

        <header className="sentence-game-header">
          <img className="sentence-island-badge" src={sentenceGameArt.island} alt="" />
          <div className="sentence-title-paper">
            <h1>句子积木岛</h1>
            <p>三关由易到难，每完成一关点亮一颗表达星</p>
          </div>
          <div className="sentence-helper">
            <img src={sentenceGameArt.helperDeer} alt="" />
            <p>
              第 {round.order} 关 · {round.difficultyLabel}：{round.prompt}
            </p>
          </div>
        </header>

        <section className="sentence-main-panel" aria-label="句子积木游戏">
          <div className="sentence-level-strip" aria-label="句子积木岛关卡">
            {sentenceLevelOrder.map((id, index) => {
              const levelRound = roundsByLevel[id]
              const isCurrent = id === activeLevelId
              const isDone = displayedCompletedIds.has(id)

              return (
                <button
                  className={`sentence-level-pill ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
                  key={id}
                  type="button"
                  onClick={() => navigate(`/level/${id}`)}
                >
                  {isDone ? <Check size={18} /> : <span>{index + 1}</span>}
                  <strong>{levelRound.difficultyLabel}</strong>
                  <small>{levelRound.title}</small>
                </button>
              )
            })}
          </div>

          <div className="sentence-builder-top">
            <div className="sentence-slot-row" aria-label="已经选择的句子积木">
              {(['person', 'expression', 'object'] as BlockKind[]).map((kind) => {
                const option = selectedOptions[kind]
                return (
                  <div className={`sentence-image-slot ${option ? 'is-filled' : ''}`} key={kind}>
                    {option ? <img src={option.image} alt="" /> : <span>{kindLabels[kind]}</span>}
                    <strong>{option?.label ?? '待选择'}</strong>
                  </div>
                )
              })}
            </div>

            <button className="sentence-speak-card" type="button" onClick={() => speak(currentSentence)}>
              <img src={sentenceGameArt.speaker} alt="" />
              <span>{currentSentence}</span>
            </button>
          </div>

          <div className="sentence-block-board">
            {visibleGroups.map((group) => (
              <div className="sentence-block-row" key={group.kind}>
                <div className={`sentence-row-label is-${group.tone}`}>{group.label}</div>
                <div className="sentence-options">
                  {group.options.map((option) => (
                    <button
                      className={`sentence-option-card is-${group.tone} ${
                        selected[option.kind] === option.id ? 'is-selected' : ''
                      }`}
                      key={option.id}
                      type="button"
                      onClick={() => pick(option)}
                    >
                      <img src={option.image} alt="" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="sentence-example-row" aria-label="句子示例">
            <SentenceFormula parts={['我', '不要', '青菜']} />
            <SentenceFormula parts={['我', '还要', '饼干']} />
          </div>

          <p className="sentence-feedback" aria-live="polite">
            {feedback}
          </p>

          <div className="sentence-actions">
            <Button variant="secondary" icon={<Lightbulb size={22} />} onClick={applyHint}>
              提示
            </Button>
            <Button variant="ghost" icon={<RotateCcw size={22} />} onClick={shufflePreset}>
              换一组
            </Button>
            <Button onClick={finishRound}>点亮表达星</Button>
            {currentLevelCompleted && nextLevelId ? (
              <Button variant="secondary" onClick={() => navigate(`/level/${nextLevelId}`)}>
                下一关
              </Button>
            ) : null}
          </div>
        </section>

        <aside className="sentence-reward-panel" aria-label="表达星奖励">
          <div className="sentence-ribbon">表达星</div>
          <img className="sentence-big-star" src={sentenceGameArt.rewardStar} alt="" />
          <div className="sentence-star-card">
            <strong>已收集表达星</strong>
            <div className="sentence-star-list" aria-label={`已收集 ${expressionStars} 颗表达星`}>
              {[0, 1, 2].map((index) => (
                <span className={index < expressionStars ? 'is-earned' : ''} key={index}>
                  ★
                </span>
              ))}
            </div>
            <p>{expressionStars} / 3 颗</p>
          </div>
          <p className="sentence-listen-note">
            {currentLevelCompleted
              ? `${round.encouragement} ${nextLevelId ? '可以继续挑战下一关。' : '三关全部完成！'}`
              : '完成当前关卡后，会获得 1 颗表达星。'}
          </p>
          <p className="sentence-save-note">{saveStatus}</p>
        </aside>
      </div>
    </main>
  )
}

function SentenceFormula({ parts }: { parts: string[] }) {
  return (
    <div className="sentence-formula">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? <b>+</b> : null}
          {part}
        </span>
      ))}
    </div>
  )
}

function findOption(kind: BlockKind, id?: string) {
  if (!id) {
    return undefined
  }

  return [...people, ...expressions, ...objects].find(
    (option) => option.kind === kind && option.id === id,
  )
}

function isSentenceLevelId(levelId: string): levelId is SentenceLevelId {
  return sentenceLevelOrder.includes(levelId as SentenceLevelId)
}
