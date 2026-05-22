import type { PropsWithChildren } from 'react'
import { GameProvider } from '../shared/store/useGameStore'

export function AppProviders({ children }: PropsWithChildren) {
  return <GameProvider>{children}</GameProvider>
}
