import { createBrowserRouter } from 'react-router-dom'
import { AchievementsPage } from '../pages/AchievementsPage'
import { AboutAutismPage } from '../pages/AboutAutismPage'
import { GameHomePage } from '../pages/GameHomePage'
import { LevelPage } from '../pages/LevelPage'
import { ParentPage } from '../pages/ParentPage'
import { BuddyChatPage } from '../features/buddy-chat/BuddyChatPage'

export const router = createBrowserRouter([
  { path: '/', element: <GameHomePage /> },
  { path: '/game', element: <GameHomePage /> },
  { path: '/achievements', element: <AchievementsPage /> },
  { path: '/parent', element: <ParentPage /> },
  { path: '/about-autism', element: <AboutAutismPage /> },
  { path: '/level/:levelId', element: <LevelPage /> },
  { path: '/buddy-chat', element: <BuddyChatPage /> },
])
