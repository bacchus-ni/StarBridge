import { useMemo, useState, type CSSProperties, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  ShoppingCart,
  Volume2,
} from 'lucide-react'
import { Button } from '../../shared/components/Button'
import { starlightMarketGameArt } from '../../shared/assets/starlightMarketGameArt'
import { useGameStore } from '../../shared/store/useGameStore'
import type { Difficulty, LevelComponentProps } from '../../shared/types/game'
import { createLevelResult } from '../../shared/utils/rewards'
import { speak } from '../../shared/utils/speech'

type MarketLevelId = (typeof marketLevelOrder)[number]

type MarketProductId =
  | 'milk'
  | 'bread'
  | 'teddy'
  | 'banana'
  | 'cookies'
  | 'medicine'
  | 'icecream'
  | 'balloon'
  | 'basket'

type SpritePosition = {
  col: number
  row: number
}

type MarketProduct = {
  id: MarketProductId
  label: string
  sprite: SpritePosition
}

type MarketRound = {
  id: MarketLevelId
  order: number
  title: string
  difficulty: Difficulty
  difficultyLabel: string
  shortPrompt: string
  prompt: string
  answerId: MarketProductId
  options: MarketProductId[]
  success: string
  retry: string
  hint: string
  transferTip: string
}

const marketLevelOrder = ['market-basic-01', 'market-medium-01', 'market-advanced-01'] as const

const products: Record<MarketProductId, MarketProduct> = {
  milk: {
    id: 'milk',
    label: '牛奶',
    sprite: { col: 0, row: 0 },
  },
  bread: {
    id: 'bread',
    label: '面包',
    sprite: { col: 1, row: 0 },
  },
  teddy: {
    id: 'teddy',
    label: '玩具熊',
    sprite: { col: 2, row: 0 },
  },
  banana: {
    id: 'banana',
    label: '香蕉',
    sprite: { col: 0, row: 1 },
  },
  cookies: {
    id: 'cookies',
    label: '饼干',
    sprite: { col: 1, row: 1 },
  },
  medicine: {
    id: 'medicine',
    label: '感冒药',
    sprite: { col: 2, row: 1 },
  },
  icecream: {
    id: 'icecream',
    label: '冰淇淋',
    sprite: { col: 0, row: 2 },
  },
  balloon: {
    id: 'balloon',
    label: '气球',
    sprite: { col: 1, row: 2 },
  },
  basket: {
    id: 'basket',
    label: '购物篮',
    sprite: { col: 2, row: 2 },
  },
}

const roundsByLevel: Record<MarketLevelId, MarketRound> = {
  'market-basic-01': {
    id: 'market-basic-01',
    order: 1,
    title: '买牛奶',
    difficulty: 'basic',
    difficultyLabel: '简单',
    shortPrompt: '请买牛奶',
    prompt: '小鹿要买牛奶，请把牛奶放进购物车里。',
    answerId: 'milk',
    options: ['milk', 'bread', 'teddy'],
    success: '对啦！这是牛奶。',
    retry: '这个不是牛奶，我们再找找。',
    hint: '可以找一找蓝白盒子的饮品，它是牛奶。',
    transferTip: '现实购物时，先听清楚要买什么，再找到对应商品。',
  },
  'market-medium-01': {
    id: 'market-medium-01',
    order: 2,
    title: '找水果',
    difficulty: 'medium',
    difficultyLabel: '进阶',
    shortPrompt: '请买一个水果',
    prompt: '小鹿要买一个水果，请把水果放进购物车里。',
    answerId: 'banana',
    options: ['banana', 'milk', 'cookies'],
    success: '真棒！香蕉是水果。',
    retry: '这个不是水果哦，我们看看哪一个可以吃，而且是水果呢？',
    hint: '水果通常可以直接吃。这里的香蕉就是水果。',
    transferTip: '在家里可以用苹果、香蕉和饼干练习“哪一个是水果”。',
  },
  'market-advanced-01': {
    id: 'market-advanced-01',
    order: 3,
    title: '妈妈感冒了',
    difficulty: 'advanced',
    difficultyLabel: '挑战',
    shortPrompt: '妈妈感冒了，现在应该买什么？',
    prompt: '妈妈感冒了，我们要买一个合适的东西带回家。',
    answerId: 'medicine',
    options: ['medicine', 'icecream', 'balloon'],
    success: '对啦！妈妈感冒了，可以买药品。',
    retry: '这个不太适合感冒的时候，我们再想想，妈妈生病了需要什么呢？',
    hint: '妈妈身体不舒服时，需要能帮助身体恢复的用品。',
    transferTip: '当家人生病或不舒服时，可以告诉大人，并选择合适的帮助用品。',
  },
}

export function StarlightMarketGame({ levelId, onComplete, onExit }: LevelComponentProps) {
  const navigate = useNavigate()
  const { progress } = useGameStore()
  const activeLevelId = isMarketLevelId(levelId) ? levelId : 'market-basic-01'
  const round = roundsByLevel[activeLevelId]
  const [selectedProductId, setSelectedProductId] = useState<MarketProductId | null>(null)
  const [wrongProductId, setWrongProductId] = useState<MarketProductId | null>(null)
  const [cartProductId, setCartProductId] = useState<MarketProductId | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const [feedback, setFeedback] = useState(round.prompt)

  const completedMarketIds = useMemo(
    () =>
      new Set(
        marketLevelOrder.filter((id) => progress.completedLevelIds.includes(id)),
      ),
    [progress.completedLevelIds],
  )
  const displayedCompletedIds = useMemo(() => {
    const nextIds = new Set(completedMarketIds)
    if (justCompleted) {
      nextIds.add(activeLevelId)
    }

    return nextIds
  }, [activeLevelId, completedMarketIds, justCompleted])

  const currentLevelCompleted = displayedCompletedIds.has(activeLevelId)
  const collectedStars = Math.min(3, displayedCompletedIds.size)
  const nextLevelId = marketLevelOrder[round.order]
  const selectedProduct = selectedProductId ? products[selectedProductId] : null
  const cartProduct = cartProductId ? products[cartProductId] : null

  function pickProduct(productId: MarketProductId) {
    const product = products[productId]
    setSelectedProductId(productId)
    setWrongProductId(null)
    setFeedback(`你选择了${product.label}。可以把它拖到购物车里，或点击购物车放进去。`)
    speak(product.label)
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, productId: MarketProductId) {
    event.dataTransfer.setData('text/plain', productId)
    event.dataTransfer.effectAllowed = 'move'
    pickProduct(productId)
  }

  function allowCartDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function dropIntoCart(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    const productId = event.dataTransfer.getData('text/plain') as MarketProductId
    if (products[productId]) {
      tryPutInCart(productId)
    }
  }

  function putSelectedIntoCart() {
    if (!selectedProductId) {
      const prompt = '先选择一个商品，再放进购物车。'
      setFeedback(prompt)
      speak(prompt)
      return
    }

    tryPutInCart(selectedProductId)
  }

  function tryPutInCart(productId: MarketProductId) {
    setSelectedProductId(productId)

    if (productId !== round.answerId) {
      setWrongProductId(productId)
      setCartProductId(null)
      setFeedback(round.retry)
      speak(round.retry)
      return
    }

    setWrongProductId(null)
    setCartProductId(productId)
    setFeedback(round.success)
    speak(round.success)

    if (!currentLevelCompleted) {
      const result = createLevelResult(activeLevelId)
      if (result) {
        onComplete(result)
      }
    }

    setJustCompleted(true)
  }

  function applyHint() {
    setFeedback(`提示：${round.hint}`)
    speak(round.hint)
  }

  function resetRound() {
    setSelectedProductId(null)
    setWrongProductId(null)
    setCartProductId(null)
    setJustCompleted(false)
    setFeedback(round.prompt)
  }

  return (
    <main
      className="market-game-screen"
      style={{ backgroundImage: `url(${starlightMarketGameArt.bg})` } as CSSProperties}
    >
      <div className="market-game-stage">
        <button className="market-back-button" type="button" onClick={onExit}>
          <ArrowLeft size={20} />
          返回地图
        </button>

        <header className="market-game-header">
          <img className="market-island-badge" src={starlightMarketGameArt.island} alt="" />
          <div className="market-title-paper">
            <h1>星光超市购物</h1>
            <p>把正确的商品拖进购物车</p>
          </div>
          <div className="market-helper">
            <img src={starlightMarketGameArt.helperDeer} alt="" />
            <p>拖动正确商品到购物车里吧！</p>
          </div>
        </header>

        <section className="market-main-panel" aria-label="星光超市购物小游戏">
          <div className="market-level-strip" aria-label="星光超市关卡">
            {marketLevelOrder.map((id, index) => {
              const levelRound = roundsByLevel[id]
              const isCurrent = id === activeLevelId
              const isDone = displayedCompletedIds.has(id)

              return (
                <button
                  className={`market-level-pill ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
                  key={id}
                  type="button"
                  onClick={() => navigate(`/level/${id}`)}
                >
                  {isDone ? <Check size={18} /> : <span>{index + 1}</span>}
                  <strong>{levelRound.difficultyLabel}</strong>
                  <small>{levelRound.title}</small>
                </button>
              )
            })}
          </div>

          <div className="market-task-card">
            <div className="market-question-row">
              <div>
                <p>第 1 步 / 共 1 步</p>
                <h2>{round.shortPrompt}</h2>
                <span>{round.prompt}</span>
              </div>
              <button
                className="market-speak-button"
                type="button"
                aria-label="朗读任务"
                onClick={() => speak(round.prompt)}
              >
                <Volume2 size={24} />
              </button>
            </div>

            <div className="market-shopping-layout">
              <div className="market-product-grid" aria-label="商品选项">
                {round.options.map((productId, index) => {
                  const product = products[productId]
                  const selected = selectedProductId === productId
                  const wrong = wrongProductId === productId

                  return (
                    <button
                      className={`market-product-card ${selected ? 'is-selected' : ''} ${
                        wrong ? 'is-wrong' : ''
                      }`}
                      draggable
                      key={product.id}
                      type="button"
                      onClick={() => pickProduct(product.id)}
                      onDragStart={(event) => startDrag(event, product.id)}
                    >
                      <span
                        className="market-product-art"
                        style={getSpriteStyle(product.sprite)}
                        aria-hidden="true"
                      />
                      <span className="market-option-label">
                        <b>{String.fromCharCode(65 + index)}</b>
                        <strong>{product.label}</strong>
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                className={`market-cart-drop-zone ${cartProduct ? 'has-product' : ''}`}
                type="button"
                onClick={putSelectedIntoCart}
                onDragOver={allowCartDrop}
                onDrop={dropIntoCart}
              >
                <span className="market-cart-rail" aria-hidden="true" />
                <span className="market-cart-basket">
                  <span
                    className="market-cart-product-art"
                    style={getSpriteStyle(cartProduct?.sprite ?? products.basket.sprite)}
                    aria-hidden="true"
                  />
                </span>
                <span className="market-cart-copy">
                  <ShoppingCart size={28} />
                  <strong>{cartProduct ? `${cartProduct.label}已进购物车` : '拖到购物车'}</strong>
                  <small>
                    {selectedProduct
                      ? `当前选择：${selectedProduct.label}`
                      : '把正确的商品拖到这里'}
                  </small>
                </span>
              </button>
            </div>

            <div className="market-step-strip" aria-label="购物步骤">
              <span className={selectedProductId ? 'is-active' : ''}>看任务</span>
              <i />
              <span className={selectedProductId ? 'is-active' : ''}>选择商品</span>
              <i />
              <span className={cartProduct ? 'is-active' : ''}>放进购物车</span>
            </div>

            <p className="market-feedback" aria-live="polite">
              {feedback}
            </p>
          </div>

          <div className="market-actions">
            <Button variant="secondary" icon={<Lightbulb size={22} />} onClick={applyHint}>
              提示
            </Button>
            <Button variant="ghost" icon={<RotateCcw size={22} />} onClick={resetRound}>
              重来本关
            </Button>
            {currentLevelCompleted && nextLevelId ? (
              <Button icon={<ArrowRight size={22} />} onClick={() => navigate(`/level/${nextLevelId}`)}>
                下一关
              </Button>
            ) : null}
            {currentLevelCompleted && !nextLevelId ? (
              <Button onClick={() => navigate('/achievements')}>查看购物徽章</Button>
            ) : null}
          </div>
        </section>

        <aside className="market-reward-panel" aria-label="购物徽章奖励">
          <div className="market-ribbon">购物徽章</div>
          <img className="market-big-badge" src={starlightMarketGameArt.badge} alt="" />
          <div className="market-progress-card">
            <strong>已收集购物星</strong>
            <div className="market-star-list" aria-label={`已收集 ${collectedStars} 颗购物星`}>
              {[0, 1, 2].map((index) => (
                <span className={index < collectedStars ? 'is-earned' : ''} key={index}>
                  ★
                </span>
              ))}
            </div>
            <p>{collectedStars} / 3 颗</p>
          </div>
          <p className="market-listen-note">
            {currentLevelCompleted
              ? `${round.success} ${nextLevelId ? '可以继续下一关。' : '三关完成，购物徽章点亮了。'}`
              : '完成当前购物任务后，会收集 1 颗购物星。'}
          </p>
          <p className="market-transfer-note">{round.transferTip}</p>
        </aside>
      </div>
    </main>
  )
}

function getSpriteStyle(position: SpritePosition) {
  return {
    backgroundImage: `url(${starlightMarketGameArt.productsAtlas})`,
    backgroundPosition: getAtlasPosition(position.col, position.row, 3, 3),
  } as CSSProperties
}

function getAtlasPosition(col: number, row: number, columns: number, rows: number) {
  const x = columns <= 1 ? 0 : (col / (columns - 1)) * 100
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100

  return `${x}% ${y}%`
}

function isMarketLevelId(levelId: string): levelId is MarketLevelId {
  return marketLevelOrder.includes(levelId as MarketLevelId)
}
