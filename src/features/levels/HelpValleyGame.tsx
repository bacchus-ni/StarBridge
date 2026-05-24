import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lightbulb, RotateCcw, Volume2 } from 'lucide-react'
import { Button } from '../../shared/components/Button'
import { helpValleyGameArt } from '../../shared/assets/helpValleyGameArt'
import { useGameStore } from '../../shared/store/useGameStore'
import type { Difficulty, LevelComponentProps } from '../../shared/types/game'
import { createLevelResult } from '../../shared/utils/rewards'
import { speak } from '../../shared/utils/speech'

type HelpLevelId = (typeof helpLevelOrder)[number]

type AtlasPosition = {
  col: number
  row: number
}

type HelpOption = {
  id: string
  label: string
  image?: AtlasPosition
}

type HelpQuestion = {
  id: string
  prompt: string
  answerId: string
  options: HelpOption[]
  success: string
  retry: string
}

type HelpRound = {
  id: HelpLevelId
  order: number
  title: string
  difficulty: Difficulty
  difficultyLabel: string
  helperPrompt: string
  scenario: string
  sceneIndex: number
  questions: HelpQuestion[]
  completion: string
  transferTip: string
}

const helpLevelOrder = ['help-basic-01', 'help-medium-01', 'help-advanced-01'] as const

const roundsByLevel: Record<HelpLevelId, HelpRound> = {
  'help-basic-01': {
    id: 'help-basic-01',
    order: 1,
    title: '断桥求助',
    difficulty: 'basic',
    difficultyLabel: '简单',
    helperPrompt: '第 1 关：看到桥断了，先停下来，找可靠的人帮忙。',
    scenario: '前面的木桥断了，过不去。现在应该怎么办？',
    sceneIndex: 0,
    questions: [
      {
        id: 'bridge-action',
        prompt: '现在应该怎么办？',
        answerId: 'ask-guardian',
        options: [
          { id: 'jump', label: '自己跳过去', image: { col: 0, row: 0 } },
          { id: 'ask-guardian', label: '找山谷守护者帮忙', image: { col: 1, row: 0 } },
          { id: 'cry', label: '坐在地上哭', image: { col: 2, row: 0 } },
        ],
        success: '对了。先停下来，找可靠的人帮忙。',
        retry: '我们再想一想。桥断了，跳过去不安全，可以找可靠的人帮忙。',
      },
      {
        id: 'bridge-say',
        prompt: '应该怎么说？',
        answerId: 'clear-bridge-help',
        options: [
          { id: 'hurry', label: '“快点！”' },
          { id: 'clear-bridge-help', label: '“你好，桥断了，我过不去，请你帮帮我。”' },
          { id: 'go-home', label: '“我要回家。”' },
        ],
        success: '你说清楚了发生什么，也说清楚了你需要什么帮助。',
        retry: '我们再试一次。可以把发生了什么和需要什么帮助都说清楚。',
      },
    ],
    completion: '你说清楚了发生什么，也说清楚了你需要什么帮助。',
    transferTip: '在生活里遇到过不去、拿不到、打不开的事情时，也可以这样求助。',
  },
  'help-medium-01': {
    id: 'help-medium-01',
    order: 2,
    title: '迷路求助',
    difficulty: 'medium',
    difficultyLabel: '进阶',
    helperPrompt: '第 2 关：雾气变大时，找穿制服的工作人员或老师帮忙。',
    scenario: '山谷雾气很大，小冒险者找不到回营地的路。',
    sceneIndex: 1,
    questions: [
      {
        id: 'lost-person',
        prompt: '你应该找谁？',
        answerId: 'staff',
        options: [
          { id: 'staff', label: '穿制服的山谷管理员', image: { col: 0, row: 1 } },
          { id: 'fox', label: '陌生狐狸', image: { col: 1, row: 1 } },
          { id: 'stone', label: '一块石头', image: { col: 2, row: 1 } },
        ],
        success: '对了。迷路时，可以找工作人员、老师或可靠的大人。',
        retry: '我们再想一想。迷路时要找可靠的大人，不跟陌生人走。',
      },
      {
        id: 'lost-say',
        prompt: '你应该怎么说？',
        answerId: 'clear-lost-help',
        options: [
          { id: 'clear-lost-help', label: '“我找不到营地了，请你帮我。”' },
          { id: 'go-away', label: '“你走开。”' },
          { id: 'dont-know', label: '“我不知道。”' },
        ],
        success: '你说出了自己找不到路，也说出了需要帮助。',
        retry: '我们再试一次。可以清楚说出“我找不到路了，请你帮我”。',
      },
    ],
    completion: '在商场、公园或学校找不到家人时，也可以找工作人员或老师帮忙。',
    transferTip: '现实里迷路时，优先找穿制服的工作人员、老师或警察帮忙。',
  },
  'help-advanced-01': {
    id: 'help-advanced-01',
    order: 3,
    title: '身体不舒服',
    difficulty: 'advanced',
    difficultyLabel: '挑战',
    helperPrompt: '第 3 关：身体不舒服时，告诉可靠的大人，停下来休息。',
    scenario: '小冒险者走着走着觉得头晕。',
    sceneIndex: 2,
    questions: [
      {
        id: 'body-action',
        prompt: '现在应该怎么办？',
        answerId: 'tell-adult',
        options: [
          { id: 'keep-running', label: '继续跑', image: { col: 0, row: 2 } },
          { id: 'tell-adult', label: '告诉老师或家长', image: { col: 1, row: 2 } },
          { id: 'hide', label: '藏起来', image: { col: 2, row: 2 } },
        ],
        success: '对了。身体不舒服时，要告诉老师或家长。',
        retry: '我们再想一想。身体不舒服时，不要硬撑或躲起来，要告诉可靠的大人。',
      },
      {
        id: 'body-say',
        prompt: '怎么说更清楚？',
        answerId: 'clear-body-help',
        options: [
          { id: 'clear-body-help', label: '“我不舒服，想休息一下。”' },
          { id: 'bad', label: '“不好。”' },
          { id: 'no', label: '“不要。”' },
        ],
        success: '你说出了身体感受，也说出了想休息的需要。',
        retry: '我们再试一次。可以说清楚身体感觉和需要，比如“我不舒服，想休息一下”。',
      },
    ],
    completion: '身体不舒服时，要告诉可靠的大人，这样别人才能帮助你。',
    transferTip: '现实里觉得头晕、肚子痛、太累时，都可以告诉老师或家长。',
  },
}

export function HelpValleyGame({ levelId, onComplete, onExit }: LevelComponentProps) {
  const navigate = useNavigate()
  const { progress } = useGameStore()
  const activeLevelId = isHelpLevelId(levelId) ? levelId : 'help-basic-01'
  const round = roundsByLevel[activeLevelId]
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [completedQuestionIds, setCompletedQuestionIds] = useState<Set<string>>(new Set())
  const [justCompleted, setJustCompleted] = useState(false)
  const [feedback, setFeedback] = useState(round.scenario)

  const completedHelpIds = useMemo(
    () =>
      new Set(
        helpLevelOrder.filter((id) => progress.completedLevelIds.includes(id)),
      ),
    [progress.completedLevelIds],
  )
  const displayedCompletedIds = useMemo(() => {
    const nextIds = new Set(completedHelpIds)
    if (justCompleted) {
      nextIds.add(activeLevelId)
    }

    return nextIds
  }, [activeLevelId, completedHelpIds, justCompleted])

  const currentQuestion = round.questions[questionIndex]
  const currentLevelCompleted = displayedCompletedIds.has(activeLevelId)
  const collectedLanterns = Math.min(3, displayedCompletedIds.size)
  const nextLevelId = helpLevelOrder[round.order]
  const screenStyle = {
    backgroundImage: `url(${helpValleyGameArt.bg})`,
    '--help-scenes': `url(${helpValleyGameArt.scenes})`,
    '--help-options': `url(${helpValleyGameArt.options})`,
  } as CSSProperties
  const sceneStyle = {
    backgroundPosition: getAtlasPosition(round.sceneIndex, 0, 3, 1),
  } as CSSProperties

  function pickOption(option: HelpOption) {
    setSelectedOptionId(option.id)
    speak(option.label)

    if (option.id !== currentQuestion.answerId) {
      setFeedback(currentQuestion.retry)
      speak(currentQuestion.retry)
      return
    }

    const nextCompletedQuestionIds = new Set(completedQuestionIds)
    nextCompletedQuestionIds.add(currentQuestion.id)
    setCompletedQuestionIds(nextCompletedQuestionIds)

    if (questionIndex < round.questions.length - 1) {
      setQuestionIndex((index) => index + 1)
      setSelectedOptionId(null)
      setFeedback('很好。现在再想一想，应该怎么说？')
      return
    }

    completeRound()
  }

  function completeRound() {
    if (!currentLevelCompleted) {
      const result = createLevelResult(activeLevelId)
      if (result) {
        onComplete(result)
      }
    }

    setJustCompleted(true)
    setFeedback(round.completion)
    speak(round.completion)
  }

  function applyHint() {
    const answer = currentQuestion.options.find((option) => option.id === currentQuestion.answerId)
    const hint = answer
      ? `可以试试这个选择：${answer.label}`
      : '先停下来，找可靠的人，再说清楚需要什么帮助。'

    setFeedback(hint)
    speak(hint)
  }

  function resetRound() {
    setQuestionIndex(0)
    setSelectedOptionId(null)
    setCompletedQuestionIds(new Set())
    setJustCompleted(false)
    setFeedback(round.scenario)
  }

  return (
    <main className="help-game-screen" style={screenStyle}>
      <div className="help-game-stage">
        <button className="help-back-button" type="button" onClick={onExit}>
          <ArrowLeft size={20} />
          返回地图
        </button>

        <header className="help-game-header">
          <img className="help-island-badge" src={helpValleyGameArt.island} alt="" />
          <div className="help-title-paper">
            <h1>求助山谷</h1>
            <p>看见困难，找到可靠的人，清楚说出需要的帮助</p>
          </div>
          <div className="help-helper">
            <img src={helpValleyGameArt.helperDeer} alt="" />
            <p>
              第 {round.order} 关 · {round.difficultyLabel}：{round.helperPrompt}
            </p>
          </div>
        </header>

        <section className="help-main-panel" aria-label="求助山谷问答游戏">
          <div className="help-level-strip" aria-label="求助山谷关卡">
            {helpLevelOrder.map((id, index) => {
              const levelRound = roundsByLevel[id]
              const isCurrent = id === activeLevelId
              const isDone = displayedCompletedIds.has(id)

              return (
                <button
                  className={`help-level-pill ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
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

          <div className="help-quest-panel">
            <div className="help-scene-card" aria-hidden="true">
              <span className="help-scene-image" style={sceneStyle} />
            </div>

            <div className="help-question-card">
              <div className="help-question-topline">
                <div>
                  <p>第 {questionIndex + 1} 步 / 共 2 步</p>
                  <h2>{currentQuestion.prompt}</h2>
                </div>
                <button
                  className="help-speak-button"
                  type="button"
                  aria-label="朗读题目"
                  onClick={() => speak(`${round.scenario} ${currentQuestion.prompt}`)}
                >
                  <Volume2 size={24} />
                </button>
              </div>

              <div
                className={`help-option-grid ${
                  currentQuestion.options.some((option) => option.image)
                    ? 'is-art-step'
                    : 'is-text-step'
                }`}
              >
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOptionId === option.id
                  const isAnswer = option.id === currentQuestion.answerId
                  const optionStyle = option.image
                    ? ({
                        backgroundPosition: getAtlasPosition(
                          option.image.col,
                          option.image.row,
                          3,
                          3,
                        ),
                      } as CSSProperties)
                    : undefined

                  return (
                    <button
                      className={`help-answer-card ${option.image ? 'has-art' : 'is-text-only'} ${
                        isSelected ? 'is-selected' : ''
                      } ${isSelected && isAnswer ? 'is-correct' : ''}`}
                      key={option.id}
                      type="button"
                      onClick={() => pickOption(option)}
                    >
                      {option.image ? (
                        <span className="help-option-art" style={optionStyle} />
                      ) : (
                        <span className="help-quote-mark">“ ”</span>
                      )}
                      <span className="help-option-label">
                        <b>{String.fromCharCode(65 + index)}</b>
                        <strong>{option.label}</strong>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="help-path-strip" aria-label="求助步骤">
              <span className="is-active">停下来</span>
              <i />
              <span className={completedQuestionIds.size >= 1 ? 'is-active' : ''}>找可靠的人</span>
              <i />
              <span className={justCompleted ? 'is-active' : ''}>说清楚需要什么帮助</span>
            </div>

            <p className="help-feedback" aria-live="polite">
              {feedback}
            </p>
          </div>

          <div className="help-actions">
            <Button variant="secondary" icon={<Lightbulb size={22} />} onClick={applyHint}>
              提示
            </Button>
            <Button variant="ghost" icon={<RotateCcw size={22} />} onClick={resetRound}>
              重来本关
            </Button>
            {currentLevelCompleted && nextLevelId ? (
              <Button onClick={() => navigate(`/level/${nextLevelId}`)}>下一关</Button>
            ) : null}
            {currentLevelCompleted && !nextLevelId ? (
              <Button onClick={() => navigate('/achievements')}>查看求助灯徽</Button>
            ) : null}
          </div>
        </section>

        <aside className="help-reward-panel" aria-label="求助灯徽奖励">
          <div className="help-ribbon">求助灯徽</div>
          <img className="help-big-lantern" src={helpValleyGameArt.lanternBadge} alt="" />
          <div className="help-lantern-card">
            <strong>已收集求助灯</strong>
            <div className="help-lantern-list" aria-label={`已收集 ${collectedLanterns} 盏求助灯`}>
              {[0, 1, 2].map((index) => (
                <span className={index < collectedLanterns ? 'is-earned' : ''} key={index}>
                  ◆
                </span>
              ))}
            </div>
            <p>{collectedLanterns} / 3 盏</p>
          </div>
          <p className="help-listen-note">
            {currentLevelCompleted
              ? `${round.completion} ${nextLevelId ? '可以继续挑战下一关。' : '三关全部完成，求助灯徽点亮了。'}`
              : '完成当前问答后，会收集 1 盏求助灯。'}
          </p>
          <p className="help-transfer-note">{round.transferTip}</p>
          <p className="help-save-note">完成后会进入成就页和家长端今日建议</p>
        </aside>
      </div>
    </main>
  )
}

function getAtlasPosition(col: number, row: number, columns: number, rows: number) {
  const x = columns <= 1 ? 0 : (col / (columns - 1)) * 100
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100

  return `${x}% ${y}%`
}

function isHelpLevelId(levelId: string): levelId is HelpLevelId {
  return helpLevelOrder.includes(levelId as HelpLevelId)
}
