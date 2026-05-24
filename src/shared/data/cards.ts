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
  {
    id: 'bridge-help',
    type: 'help',
    name: '断桥求助卡',
    description: '遇到过不去的地方时，停下来找可靠的人帮忙。',
    voiceText: '你好，桥断了，我过不去，请你帮帮我。',
    skillTag: 'ask_help',
  },
  {
    id: 'lost-help',
    type: 'help',
    name: '迷路求助卡',
    description: '迷路时找工作人员、老师或可靠的大人帮忙。',
    voiceText: '我找不到营地了，请你帮我。',
    skillTag: 'ask_help',
  },
  {
    id: 'body-signal-help',
    type: 'help',
    name: '身体信号卡',
    description: '身体不舒服时，要告诉老师或家长。',
    voiceText: '我不舒服，想休息一下。',
    skillTag: 'ask_help',
  },
]

export function getCardById(cardId: string) {
  return cards.find((card) => card.id === cardId)
}
