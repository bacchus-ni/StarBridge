import { useEffect, useMemo, useReducer, type PropsWithChildren } from 'react'
import {
  createActions,
  gameReducer,
  GameStoreContext,
  loadProgress,
  STORAGE_KEY,
} from './gameStoreCore'

export function GameProvider({ children }: PropsWithChildren) {
  const [progress, dispatch] = useReducer(gameReducer, undefined, loadProgress)
  const actions = useMemo(() => createActions(dispatch), [])
  const value = useMemo(() => ({ progress, actions }), [actions, progress])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}
