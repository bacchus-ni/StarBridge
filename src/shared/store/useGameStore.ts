import { useContext } from 'react'
import { GameStoreContext } from './gameStoreCore'

export function useGameStore() {
  const store = useContext(GameStoreContext)

  if (!store) {
    throw new Error('useGameStore must be used inside GameProvider')
  }

  return store
}
