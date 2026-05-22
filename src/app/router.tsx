import { createBrowserRouter } from 'react-router-dom'
import { AchievementsPage } from '../pages/AchievementsPage'
import { GameHomePage } from '../pages/GameHomePage'
import { LevelPage } from '../pages/LevelPage'
import { ParentPage } from '../pages/ParentPage'

export const router = createBrowserRouter([
  { path: '/', element: <GameHomePage /> },
  { path: '/game', element: <GameHomePage /> },
  { path: '/achievements', element: <AchievementsPage /> },
  { path: '/parent', element: <ParentPage /> },
  { path: '/level/:levelId', element: <LevelPage /> },
])
