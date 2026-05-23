import type { PracticeSuggestion, SkillTag } from '../types/game'

export const practiceSuggestionTemplates: Record<SkillTag, PracticeSuggestion> = {
  express_need: {
    id: 'snack-request',
    title: '零食时间：主动表达需求',
    scenario: '把饼干或水果放在孩子看得见的位置，给出两个清晰选择。',
    steps: [
      '先说：“你想要饼干还是苹果？可以告诉我。”',
      '等待孩子用口语、指认、图卡或按钮表达。',
      '回应时温和复述：“你说了我要饼干，我听见了。”',
    ],
    parentTip: '先给选择，再等待表达；孩子用任何方式表达都算完成。',
    relatedSkill: 'express_need',
  },
  greeting: {
    id: 'friendly-speech',
    title: '放学路上：选择友好话语',
    scenario: '遇到同学、老师或家人需要帮助时，先停下来看看发生了什么。',
    steps: [
      '家长先描述场景：“你看到同学了，可以说什么？”',
      '给出两个清晰选项，如“早上好”或“我想休息一下”。',
      '孩子说出、点选或用动作表达后，家长温和复述并回应。',
    ],
    parentTip: '先观察场景，再选择话语；不要求一次说完整，能做出合适选择就算完成。',
    relatedSkill: 'greeting',
  },
  ask_help: {
    id: 'toy-help',
    title: '玩具时间：请求帮助',
    scenario: '把一个喜欢的玩具放在稍微够不到的位置。',
    steps: ['先等待 3 到 5 秒。', '提示孩子可以说“请帮帮我”。', '孩子表达后马上帮忙拿到玩具。'],
    parentTip: '帮助发生在表达之后，让孩子感到表达是有用的。',
    relatedSkill: 'ask_help',
  },
  recognize_emotion: {
    id: 'picture-book-emotion',
    title: '绘本共读：识别情绪',
    scenario: '读绘本时停在人物表情清楚的一页。',
    steps: ['指着人物表情问：“他现在是开心还是难过？”', '给出两张情绪卡或两个口头选项。', '孩子选择后，补一句原因说明。'],
    parentTip: '用二选一降低难度，先让孩子能选出来。',
    relatedSkill: 'recognize_emotion',
  },
  understand_others: {
    id: 'care-about-others',
    title: '日常观察：理解他人感受',
    scenario: '看到家人皱眉、叹气或安静时，引导孩子观察。',
    steps: ['轻声说：“他看起来有点难过。”', '问：“我们可以怎么帮他？”', '让孩子选择递纸巾、拍拍手或说一句安慰的话。'],
    parentTip: '重点是发现他人的状态，不要求孩子马上做复杂回应。',
    relatedSkill: 'understand_others',
  },
  use_polite_words: {
    id: 'daily-thanks',
    title: '日常互动：使用请和谢谢',
    scenario: '家人帮孩子递水、拿玩具或开门时。',
    steps: ['先示范：“拿到了，我们可以说谢谢。”', '等待孩子说、点卡或做动作。', '家长回应：“谢谢你告诉我。”'],
    parentTip: '把礼貌语放在真实互动里练，避免变成机械背诵。',
    relatedSkill: 'use_polite_words',
  },
  take_turns: {
    id: 'turn-taking-game',
    title: '积木时间：轮流玩',
    scenario: '用积木或小车做一个两人轮流的小活动。',
    steps: ['先说：“现在我放一块，然后轮到你。”', '孩子完成后说：“现在又轮到我。”', '用 3 到 4 轮结束，保持体验轻松。'],
    parentTip: '轮流时间要短，成功体验比持续时长更重要。',
    relatedSkill: 'take_turns',
  },
}
