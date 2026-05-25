export type IslandId =
  | 'sentence_blocks'
  | 'emotion_match'
  | 'greeting_match'
  | 'help_valley'
  | 'starlight_market'

export type Difficulty = 'basic' | 'medium' | 'advanced'

export type SkillTag =
  | 'express_need'
  | 'greeting'
  | 'ask_help'
  | 'recognize_emotion'
  | 'understand_others'
  | 'use_polite_words'
  | 'take_turns'
  | 'daily_life_choice'

export type CardType = 'expression' | 'emotion' | 'greeting' | 'help' | 'daily_life'

export interface LevelComponentProps {
  levelId: string
  difficulty: Difficulty
  onComplete: (result: LevelResult) => void
  onExit?: () => void
}

export interface LevelResult {
  levelId: string
  islandId: IslandId
  difficulty: Difficulty
  starsEarned: number
  cardsEarned: string[]
  skillTags: SkillTag[]
  completedAt: string
}

export interface IslandConfig {
  id: IslandId
  name: string
  description: string
  route: string
  badgeId: string
  themeSkill: SkillTag
  levels: LevelConfig[]
}

export interface LevelConfig {
  id: string
  islandId: IslandId
  title: string
  difficulty: Difficulty
  targetSkill: SkillTag
  rewardCardIds: string[]
  rewardStars: number
  mechanic:
    | 'sentence_blocks'
    | 'emotion_match'
    | 'friendly_speech_match'
    | 'help_valley'
    | 'starlight_market'
}

export interface CardConfig {
  id: string
  type: CardType
  name: string
  description: string
  voiceText: string
  skillTag: SkillTag
}

export interface BadgeConfig {
  id: string
  islandId: IslandId
  name: string
  description: string
  unlockText: string
}

export interface BuddyGrowth {
  stage: number
  exp: number
}

export interface RealLifeTask {
  id: string
  sourceLevelId: string
  title: string
  skillTag: SkillTag
  suggestion: string
  parentTip: string
  status: 'pending' | 'done'
  createdAt: string
  completedAt?: string
}

export interface PlayerProgress {
  totalStars: number
  todayStars: number
  completedLevelIds: string[]
  collectedCardIds: string[]
  badgeProgress: Record<string, number>
  buddyGrowth: BuddyGrowth
  todaySkillTags: SkillTag[]
  realLifeTasks: RealLifeTask[]
}

export interface PracticeSuggestionInput {
  completedLevelIds: string[]
  skillTags: SkillTag[]
  collectedCardIds: string[]
}

export interface PracticeSuggestion {
  id: string
  title: string
  scenario: string
  steps: string[]
  parentTip: string
  relatedSkill: SkillTag
}
