import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from 'react'
import { getBadgeProgressAfterCompletion, getBadgeKey } from '../utils/rewards'
import { createRealLifeTask } from '../utils/practice'
import type { LevelResult, PlayerProgress, RealLifeTask } from '../types/game'

const STORAGE_KEY = 'starbridge-demo-progress:v1'

const initialProgress: PlayerProgress = {
  totalStars: 0,
  todayStars: 0,
  completedLevelIds: [],
  collectedCardIds: [],
  badgeProgress: {
    'brave-expression': 0,
    'emotion-helper': 0,
    'polite-friend': 0,
  },
  buddyGrowth: {
    stage: 1,
    exp: 0,
  },
  todaySkillTags: [],
  realLifeTasks: [],
}

type GameAction =
  | { type: 'completeLevel'; result: LevelResult }
  | { type: 'collectCards'; cardIds: string[] }
  | { type: 'addStars'; count: number }
  | { type: 'updateBadgeProgress'; result: LevelResult }
  | { type: 'generateRealLifeTask'; result: LevelResult }
  | { type: 'completeRealLifeTask'; taskId: string }
  | { type: 'addBuddyExp'; exp: number }
  | { type: 'resetDemoProgress' }

type GameActions = {
  completeLevel(result: LevelResult): void
  collectCards(cardIds: string[]): void
  addStars(count: number): void
  updateBadgeProgress(result: LevelResult): void
  generateRealLifeTask(result: LevelResult): void
  completeRealLifeTask(taskId: string): void
  addBuddyExp(exp: number): void
  resetDemoProgress(): void
}

type GameStore = {
  progress: PlayerProgress
  actions: GameActions
}

const GameStoreContext = createContext<GameStore | null>(null)

export function GameProvider({ children }: PropsWithChildren) {
  const [progress, dispatch] = useReducer(gameReducer, undefined, loadProgress)
  const actions = useMemo(() => createActions(dispatch), [])
  const value = useMemo(() => ({ progress, actions }), [actions, progress])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}

export function useGameStore() {
  const store = useContext(GameStoreContext)

  if (!store) {
    throw new Error('useGameStore must be used inside GameProvider')
  }

  return store
}

function createActions(dispatch: Dispatch<GameAction>): GameActions {
  return {
    completeLevel(result) {
      dispatch({ type: 'completeLevel', result })
    },
    collectCards(cardIds) {
      dispatch({ type: 'collectCards', cardIds })
    },
    addStars(count) {
      dispatch({ type: 'addStars', count })
    },
    updateBadgeProgress(result) {
      dispatch({ type: 'updateBadgeProgress', result })
    },
    generateRealLifeTask(result) {
      dispatch({ type: 'generateRealLifeTask', result })
    },
    completeRealLifeTask(taskId) {
      dispatch({ type: 'completeRealLifeTask', taskId })
    },
    addBuddyExp(exp) {
      dispatch({ type: 'addBuddyExp', exp })
    },
    resetDemoProgress() {
      dispatch({ type: 'resetDemoProgress' })
    },
  }
}

function gameReducer(state: PlayerProgress, action: GameAction): PlayerProgress {
  switch (action.type) {
    case 'completeLevel': {
      if (state.completedLevelIds.includes(action.result.levelId)) {
        return state
      }

      const withStars = addStarsToProgress(state, action.result.starsEarned)
      const withCards = collectCardsInProgress(withStars, action.result.cardsEarned)
      const withBadge = updateBadgeProgressInProgress(withCards, action.result)
      const withTask = generateRealLifeTaskInProgress(withBadge, action.result)

      return {
        ...withTask,
        completedLevelIds: [...withTask.completedLevelIds, action.result.levelId],
        todaySkillTags: Array.from(
          new Set([...withTask.todaySkillTags, ...action.result.skillTags]),
        ),
        buddyGrowth: addBuddyExpToGrowth(withTask.buddyGrowth, action.result.starsEarned * 2),
      }
    }
    case 'collectCards':
      return collectCardsInProgress(state, action.cardIds)
    case 'addStars':
      return addStarsToProgress(state, action.count)
    case 'updateBadgeProgress':
      return updateBadgeProgressInProgress(state, action.result)
    case 'generateRealLifeTask':
      return generateRealLifeTaskInProgress(state, action.result)
    case 'completeRealLifeTask':
      return completeRealLifeTaskInProgress(state, action.taskId)
    case 'addBuddyExp':
      return { ...state, buddyGrowth: addBuddyExpToGrowth(state.buddyGrowth, action.exp) }
    case 'resetDemoProgress':
      return initialProgress
  }
}

function addStarsToProgress(state: PlayerProgress, count: number): PlayerProgress {
  return {
    ...state,
    totalStars: state.totalStars + count,
    todayStars: state.todayStars + count,
  }
}

function collectCardsInProgress(state: PlayerProgress, cardIds: string[]): PlayerProgress {
  return {
    ...state,
    collectedCardIds: Array.from(new Set([...state.collectedCardIds, ...cardIds])),
  }
}

function updateBadgeProgressInProgress(
  state: PlayerProgress,
  result: LevelResult,
): PlayerProgress {
  const badgeKey = getBadgeKey(result.islandId)
  const currentProgress = state.badgeProgress[badgeKey] ?? 0

  return {
    ...state,
    badgeProgress: {
      ...state.badgeProgress,
      [badgeKey]: getBadgeProgressAfterCompletion(currentProgress, result.difficulty),
    },
  }
}

function generateRealLifeTaskInProgress(
  state: PlayerProgress,
  result: LevelResult,
): PlayerProgress {
  const task = createRealLifeTask(result)
  const exists = state.realLifeTasks.some((item) => item.id === task.id)

  if (exists) {
    return state
  }

  return {
    ...state,
    realLifeTasks: [task, ...state.realLifeTasks],
  }
}

function completeRealLifeTaskInProgress(
  state: PlayerProgress,
  taskId: string,
): PlayerProgress {
  const task = state.realLifeTasks.find((item) => item.id === taskId)

  if (!task || task.status === 'done') {
    return state
  }

  const completedTask: RealLifeTask = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  }

  return {
    ...state,
    buddyGrowth: addBuddyExpToGrowth(state.buddyGrowth, 8),
    realLifeTasks: state.realLifeTasks.map((item) =>
      item.id === taskId ? completedTask : item,
    ),
  }
}

function addBuddyExpToGrowth(
  growth: PlayerProgress['buddyGrowth'],
  exp: number,
): PlayerProgress['buddyGrowth'] {
  const nextExp = growth.exp + exp

  return {
    stage: Math.min(3, Math.floor(nextExp / 30) + 1),
    exp: nextExp,
  }
}

function loadProgress(): PlayerProgress {
  if (typeof window === 'undefined') {
    return initialProgress
  }

  try {
    const rawProgress = window.localStorage.getItem(STORAGE_KEY)
    if (!rawProgress) {
      return initialProgress
    }

    const parsedProgress = JSON.parse(rawProgress) as PlayerProgress
    return {
      ...initialProgress,
      ...parsedProgress,
      badgeProgress: {
        ...initialProgress.badgeProgress,
        ...parsedProgress.badgeProgress,
      },
      buddyGrowth: {
        ...initialProgress.buddyGrowth,
        ...parsedProgress.buddyGrowth,
      },
    }
  } catch {
    return initialProgress
  }
}
