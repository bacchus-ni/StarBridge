import type { PropsWithChildren } from 'react'
import { GameProvider } from '../shared/store/GameProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <GameProvider>{children}</GameProvider>
}
