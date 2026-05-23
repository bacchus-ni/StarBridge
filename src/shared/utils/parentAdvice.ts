import { requestDeepseekChat } from '../services/deepseekChat'
import type { DeepseekChatMessage } from '../types/chat'
import type { PlayerProgress, SkillTag } from '../types/game'
import { getCollectedCards, getCompletedLevels, skillLabels } from './progress'

export type ParentAdviceResult = {
  content: string
  source: 'deepseek' | 'fallback'
}

const demoSkills: SkillTag[] = ['express_need', 'recognize_emotion', 'greeting']

export function getTodaySkillLabels(progress: PlayerProgress) {
  const skillTags = progress.todaySkillTags.length ? progress.todaySkillTags : demoSkills
  return Array.from(new Set(skillTags)).map((skill) => skillLabels[skill])
}

export async function getDeepseekParentAdvice(
  progress: PlayerProgress,
): Promise<ParentAdviceResult> {
  const response = await requestDeepseekChat({
    model: 'deepseek-chat',
    messages: buildParentAdviceMessages(progress),
  })

  return {
    content: response.content,
    source: response.fallback ? 'fallback' : 'deepseek',
  }
}

function buildParentAdviceMessages(progress: PlayerProgress): DeepseekChatMessage[] {
  const skills = getTodaySkillLabels(progress)
  const completedLevels = getCompletedLevels(progress).map((level) => level.title)
  const collectedCards = getCollectedCards(progress).map((card) => card.name)

  return [
    {
      role: 'system',
      content:
        '你是星桥计划的家长陪练建议生成助手。请用简体中文，语气温和、具体、可执行，面向孤独症儿童家长。不要诊断，不要夸大疗效，不要使用惩罚、倒计时、强迫或失败评价。',
    },
    {
      role: 'user',
      content: [
        '请基于孩子今天在游戏里练习到的技能，生成一段现实迁移建议。',
        '输出要求：只输出一段自然段，不要标题，不要项目符号，不要 Markdown，不要超过 135 个汉字。',
        `今天学会的技能：${skills.join('、')}`,
        `已完成关卡：${completedLevels.length ? completedLevels.join('、') : '暂无真实关卡记录，按演示技能生成'}`,
        `已获得图鉴卡：${collectedCards.length ? collectedCards.join('、') : '暂无'}`,
      ].join('\n'),
    },
  ]
}

export function getFallbackParentAdvice(progress: PlayerProgress) {
  const skills = getTodaySkillLabels(progress)
  return `今天孩子在游戏中练习了${skills.join('、')}。建议家长选择一个自然生活场景，比如用餐、绘本共读或日常求助时，先给出清晰选项并耐心等待孩子表达，再用温和语气复述孩子的表达，及时回应。练习时间保持短而稳定，让孩子在真实互动中慢慢把游戏里的能力迁移到生活里。`
}
