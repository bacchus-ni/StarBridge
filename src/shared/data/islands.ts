import { levels } from './levels'
import type { IslandConfig } from '../types/game'

export const islands: IslandConfig[] = [
  {
    id: 'sentence_blocks',
    name: '句子积木岛',
    description: '用词语积木拼出自己的想法',
    route: '/level/sentence-basic-01',
    badgeId: 'brave-expression',
    themeSkill: 'express_need',
    levels: levels.filter((level) => level.islandId === 'sentence_blocks'),
  },
  {
    id: 'emotion_match',
    name: '情绪消消乐湖',
    description: '认识开心、难过、生气和平静',
    route: '/level/emotion-basic-01',
    badgeId: 'emotion-helper',
    themeSkill: 'recognize_emotion',
    levels: levels.filter((level) => level.islandId === 'emotion_match'),
  },
  {
    id: 'polite_runner',
    name: '礼貌语跑酷镇',
    description: '收集请、谢谢和对不起',
    route: '/level/polite-basic-01',
    badgeId: 'polite-friend',
    themeSkill: 'use_polite_words',
    levels: levels.filter((level) => level.islandId === 'polite_runner'),
  },
]

export function getIslandById(islandId: IslandConfig['id']) {
  return islands.find((island) => island.id === islandId)
}
