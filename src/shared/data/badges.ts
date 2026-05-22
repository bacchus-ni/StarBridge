import type { BadgeConfig } from '../types/game'

export const badges: BadgeConfig[] = [
  {
    id: 'brave-expression',
    islandId: 'sentence_blocks',
    name: '勇敢表达徽章',
    description: '能主动表达需求、问候和请求帮助。',
    unlockText: '句子积木岛三档任务全部完成后解锁。',
  },
  {
    id: 'emotion-helper',
    islandId: 'emotion_match',
    name: '情绪识别徽章',
    description: '能识别常见情绪，并理解他人的感受。',
    unlockText: '情绪消消乐湖三档任务全部完成后解锁。',
  },
  {
    id: 'polite-friend',
    islandId: 'polite_runner',
    name: '友好互动徽章',
    description: '能在互动中使用请、谢谢、对不起等礼貌语。',
    unlockText: '礼貌语跑酷镇三档任务全部完成后解锁。',
  },
]

export function getBadgeById(badgeId: string) {
  return badges.find((badge) => badge.id === badgeId)
}
