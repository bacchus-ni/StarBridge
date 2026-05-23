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
    id: 'friendly-words',
    type: 'greeting',
    name: '友好话语',
    description: '根据场景选择问候、求助、道歉或休息表达。',
    voiceText: '友好话语',
    skillTag: 'greeting',
  },
]

export function getCardById(cardId: string) {
  return cards.find((card) => card.id === cardId)
}
