import type { CardConfig } from '../types/game'

export const cards: CardConfig[] = [
  {
    id: 'want-cookie',
    type: 'expression',
    name: '我要饼干',
    description: '用完整短句表达想要的东西。',
    voiceText: '我要饼干',
    skillTag: 'express_need',
  },
  {
    id: 'need-help',
    type: 'expression',
    name: '请帮帮我',
    description: '遇到困难时主动请求帮助。',
    voiceText: '请帮帮我',
    skillTag: 'ask_help',
  },
  {
    id: 'hello-friend',
    type: 'expression',
    name: '你好',
    description: '用友好的方式开始互动。',
    voiceText: '你好',
    skillTag: 'greeting',
  },
  {
    id: 'happy',
    type: 'emotion',
    name: '开心',
    description: '识别开心的表情和感受。',
    voiceText: '开心',
    skillTag: 'recognize_emotion',
  },
  {
    id: 'sad',
    type: 'emotion',
    name: '难过',
    description: '识别难过，并理解别人可能需要陪伴。',
    voiceText: '难过',
    skillTag: 'understand_others',
  },
  {
    id: 'calm',
    type: 'emotion',
    name: '平静',
    description: '知道平静是一种舒服、安稳的感觉。',
    voiceText: '平静',
    skillTag: 'recognize_emotion',
  },
  {
    id: 'please',
    type: 'polite',
    name: '请',
    description: '请求别人帮忙时使用礼貌语。',
    voiceText: '请',
    skillTag: 'use_polite_words',
  },
  {
    id: 'thank-you',
    type: 'polite',
    name: '谢谢',
    description: '得到帮助后表达感谢。',
    voiceText: '谢谢',
    skillTag: 'use_polite_words',
  },
  {
    id: 'take-turns',
    type: 'polite',
    name: '轮流玩',
    description: '在互动中等待和轮流。',
    voiceText: '我们轮流玩',
    skillTag: 'take_turns',
  },
]

export function getCardById(cardId: string) {
  return cards.find((card) => card.id === cardId)
}
