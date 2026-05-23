import { buddyChatArt } from '../assets/buddyChatArt'
import type { BuddyChatThread } from '../types/chat'

export const buddyChatSystemPrompt = [
  '你是星桥计划里的星光小鹿，正在陪孩子做温柔、稳定、清晰的聊天练习。',
  '请始终使用中文，语气温和、鼓励、不评判，不使用命令式口吻或复杂抽象比喻。',
  '每次回复尽量 2 到 4 句，先回应情绪，再给一个很小、很具体的下一步。',
  '不要一次提出超过 1 个问题。',
  '如果用户表达明显危险、自伤或极端无助，先建议立刻寻找可信赖的成年人。',
].join('\n')

export const buddyChatThreads: BuddyChatThread[] = [
  {
    id: 'hard-feelings',
    title: '觉得难过的时候',
    subtitle: '有些情绪没关系，我们一起慢慢看见它 ✨',
    preview: '我今天放学回家有点不开心，感觉有点烦躁。',
    startedAtLabel: '开始于 今天 15:30',
    avatar: buddyChatArt.deerChatAvatar,
    moodLabel: '有点烦躁',
    moodProgress: 45,
    moodNote: '每种情绪都是独特的，你值得被认真听见。',
    summaryPoints: ['孩子说出了不开心', '一起看见了烦躁', '用一句温柔的话接住情绪'],
    quickQuestions: ['我为什么会生气？', '怎么让自己冷静下来？', '如何向朋友表达难受？'],
    timeline: [
      { timeLabel: '15:30', label: '你表达了烦躁的情绪', done: true },
      { timeLabel: '15:31', label: '小鹿一起确认了感受', done: true },
      { timeLabel: '15:33', label: '你说出了让你生气的事情', done: true },
      { timeLabel: '15:34', label: '小鹿给了温和的缓冲建议', done: true },
    ],
    messages: [
      {
        id: 'hard-feelings-1',
        speaker: 'child',
        content: '我今天放学回家有点不开心，感觉有点烦躁，总想发脾气。',
        timeLabel: '15:30',
      },
      {
        id: 'hard-feelings-2',
        speaker: 'buddy',
        content:
          '谢谢你愿意告诉我这些。烦躁的时候，心里像有一团小云朵，我们先一起看见它，再慢慢把它放轻一点好吗？你愿意告诉我，今天最让你难受的那一刻是什么吗？',
        timeLabel: '15:31',
      },
      {
        id: 'hard-feelings-3',
        speaker: 'child',
        content: '同学不小心弄坏了我的手工作品，还没跟我道歉，我就很生气。',
        timeLabel: '15:33',
      },
      {
        id: 'hard-feelings-4',
        speaker: 'buddy',
        content:
          '原来是这样，难怪你会生气。生气不是坏事，它只是告诉我们这件事很重要。我们可以先做一次慢慢吸气，再一起想一句你想说的话。',
        timeLabel: '15:34',
      },
    ],
  },
  {
    id: 'need-help',
    title: '想要帮助',
    subtitle: '遇到困难时，可以先把问题说出来',
    preview: '我遇到了一些困难，不知道该怎么办……',
    startedAtLabel: '开始于 昨天 16:05',
    avatar: buddyChatArt.deerChatAvatar,
    moodLabel: '有点困惑',
    moodProgress: 34,
    moodNote: '先说出来，办法就会慢慢出现。',
    summaryPoints: ['孩子愿意说出困难', '一起找到了求助表达', '先从最小的一步开始'],
    quickQuestions: ['我可以请谁帮忙？', '怎么说“请帮帮我”？', '如果我听不懂怎么办？'],
    timeline: [
      { timeLabel: '16:05', label: '孩子说遇到困难了', done: true },
      { timeLabel: '16:06', label: '一起练习了求助句子', done: true },
      { timeLabel: '16:08', label: '小鹿提醒先慢慢来', done: true },
    ],
    messages: [
      {
        id: 'need-help-1',
        speaker: 'child',
        content: '我遇到了一些困难，不知道该怎么办……',
        timeLabel: '16:05',
      },
      {
        id: 'need-help-2',
        speaker: 'buddy',
        content:
          '谢谢你告诉我。遇到困难的时候，先说出来就已经很勇敢了。我们可以先把它分成很小的一步：你想让我帮你看一看，还是先听你讲一讲？',
        timeLabel: '16:06',
      },
    ],
  },
  {
    id: 'thanks-today',
    title: '今天学会说谢谢',
    subtitle: '把感谢说出口，会让关系变得更暖',
    preview: '老师夸我今天很有进步，我很开心！',
    startedAtLabel: '开始于 昨天 19:20',
    avatar: buddyChatArt.deerChatAvatar,
    moodLabel: '很开心',
    moodProgress: 68,
    moodNote: '开心的时候，也可以把感谢轻轻说出来。',
    summaryPoints: ['今天练习了谢谢', '学会回应帮助', '把开心分享给别人'],
    quickQuestions: ['什么时候要说谢谢？', '怎样把谢谢说得自然？', '怎么回应别人的夸奖？'],
    timeline: [
      { timeLabel: '19:20', label: '说出了感谢的话', done: true },
      { timeLabel: '19:22', label: '学会了回应夸奖', done: true },
      { timeLabel: '19:25', label: '把开心分享给别人', done: true },
    ],
    messages: [
      {
        id: 'thanks-today-1',
        speaker: 'child',
        content: '老师夸我今天很有进步，我很开心！',
        timeLabel: '19:20',
      },
      {
        id: 'thanks-today-2',
        speaker: 'buddy',
        content:
          '听起来今天是很亮的一天。你可以把这份开心说给自己听，也可以对帮助过你的人说一句谢谢。要不要我们一起把这句话练一遍？',
        timeLabel: '19:22',
      },
    ],
  },
  {
    id: 'bedtime-chat',
    title: '睡前小聊',
    subtitle: '晚安前，把今天的小心事轻轻放好',
    preview: '晚安小鹿，今天过得还不错哦~',
    startedAtLabel: '开始于 昨天 21:10',
    avatar: buddyChatArt.deerBedtime,
    moodLabel: '放松',
    moodProgress: 58,
    moodNote: '今晚的任务只是好好休息。',
    summaryPoints: ['轻轻说晚安', '回顾今天的好事情', '准备进入安静时间'],
    quickQuestions: ['今天最开心的事是什么？', '睡前可以说什么？', '怎么跟小鹿说晚安？'],
    timeline: [
      { timeLabel: '21:10', label: '开始睡前聊天', done: true },
      { timeLabel: '21:12', label: '一起回顾了今天', done: true },
      { timeLabel: '21:15', label: '准备进入安静休息', done: true },
    ],
    messages: [
      {
        id: 'bedtime-chat-1',
        speaker: 'child',
        content: '晚安小鹿，今天过得还不错哦~',
        timeLabel: '21:10',
      },
      {
        id: 'bedtime-chat-2',
        speaker: 'buddy',
        content:
          '晚安呀，谢谢你今天来和我聊天。把今天的小星星收好，明天我们再一起慢慢出发。现在可以先深呼吸三次，然后安心去睡觉。',
        timeLabel: '21:11',
      },
    ],
  },
  {
    id: 'afraid-room',
    title: '为什么会害怕',
    subtitle: '害怕的时候，我们先把房间变得更安全',
    preview: '我有时候会害怕黑黑的房间。怎么办？',
    startedAtLabel: '开始于 3 天前',
    avatar: buddyChatArt.deerChatAvatar,
    moodLabel: '有点担心',
    moodProgress: 28,
    moodNote: '害怕并不奇怪，我们可以一起找安全感。',
    summaryPoints: ['孩子说出了害怕', '一起找到了安全线索', '把害怕变成可说的话'],
    quickQuestions: ['我可以怎么让自己安心？', '害怕时先做什么？', '怎么告诉大人我害怕？'],
    timeline: [
      { timeLabel: '昨天', label: '说出了对黑暗的担心', done: true },
      { timeLabel: '昨天', label: '练习了求助表达', done: true },
      { timeLabel: '今天', label: '继续学习安抚方法', done: false },
    ],
    messages: [
      {
        id: 'afraid-room-1',
        speaker: 'child',
        content: '我有时候会害怕黑黑的房间。',
        timeLabel: '昨天',
      },
      {
        id: 'afraid-room-2',
        speaker: 'buddy',
        content:
          '谢谢你愿意告诉我。害怕的时候，我们先把房间里让你安心的东西找出来，比如小灯、熟悉的玩具，或者先叫一声大人。你愿意和我一起想一个“安心小动作”吗？',
        timeLabel: '昨天',
      },
    ],
  },
]

export const buddyChatDefaultThreadId = buddyChatThreads[0].id
