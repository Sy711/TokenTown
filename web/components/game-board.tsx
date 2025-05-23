"use client"

import { useState, useEffect, useMemo } from "react"
import TargetStack from "@/components/game/TargetStack"
import CardSlot from "@/components/game/CardSlot"
import TrashBin from "@/components/game/TrashBin"
import type { CardType, Card, CardSlots } from "@/types/game-types"
import { motion, AnimatePresence } from "framer-motion"
import { message } from "antd"

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import { Wallet, Loader2, RefreshCw, Send, Trophy, Info, Home, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { formatAddress } from "@mysten/sui/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import BackgroundIcons from "../components/background-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSuiClientQuery } from "@mysten/dapp-kit"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { previewPaymentTx, previewIncentiveSubmitTx, getLatestIncentiveSubmitEvent } from "@/contracts/query"
import type { IncentiveSubmitPreviewResult } from "@/types/game-types"
import Rankings from "@/components/game/Rankings"

interface Props {
  accountAddress: string
}

export default function GameBoard({ accountAddress }: Props) {
  const [gameState, setGameState] = useState<"playing" | "submitted" | "finished">("playing")
  const [cardSlots, setCardSlots] = useState<CardSlots[]>([])
  const [targetStack, setTargetStack] = useState<Card[]>([])
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null)
  const [drawCount, setDrawCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showRankings, setShowRankings] = useState(false)
  const [trashError, setTrashError] = useState<string | null>(null)
  const [showTrashSuccess, setShowTrashSuccess] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [showDrawAnimation, setShowDrawAnimation] = useState(false)
  const [showHint, setShowHint] = useState(true)

  // 优化拖拽灵敏度和响应性
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 0,
        tolerance: 5,
        delay: 0,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
  )

  // 自定义拖动动画配置
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  }

  const { handleSignAndExecuteTransaction: previewPayment } = useBetterSignAndExecuteTransaction({
    tx: previewPaymentTx,
  })
  const { handleSignAndExecuteTransaction: previewIncentiveSubmit } = useBetterSignAndExecuteTransaction({
    tx: previewIncentiveSubmitTx,
  })

  const [previewResult, setPreviewResult] = useState<IncentiveSubmitPreviewResult | null>(null)

  // 余额查询
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useSuiClientQuery(
    "getBalance",
    {
      owner: accountAddress,
      coinType: "0x2::sui::SUI",
    },
    {
      enabled: !!accountAddress,
      refetchInterval: 3000,
    },
  )

  useEffect(() => {
    if (balanceError) {
      console.error("余额查询错误:", balanceError)
    }
  }, [accountAddress, balance, balanceError])

  const walletBalance = useMemo(() => {
    if (!balance || !balance.totalBalance) {
      return 0
    }
    return Number(balance?.totalBalance) / 1e9
  }, [balance])

  const [currentCardTypes, setCurrentCardTypes] = useState<CardType[]>([])

  // 初始化游戏
  useEffect(() => {
    initializeEmptySlots()

    // 5秒后隐藏提示
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // 初始化空卡槽
  const initializeEmptySlots = () => {
    const slots: CardSlots[] = []
    for (let i = 0; i < 7; i++) {
      slots.push({
        id: `slot-${i}`,
        cards: [],
      })
    }
    setCardSlots(slots)
  }

  // 处理拖拽开始事件
  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string)
  }

  // 处理卡牌拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)

    if (!over) return

    const cardId = active.id as string
    const [sourceSlotId, cardIndex] = getCardLocation(cardId)

    if (!sourceSlotId || cardIndex === -1) return

    // 找到被拖拽的卡牌
    const sourceSlotIndex = cardSlots.findIndex((slot) => slot.id === sourceSlotId)
    if (sourceSlotIndex === -1) return

    const card = cardSlots[sourceSlotIndex].cards[cardIndex]

    // 检查是否是最顶层的卡牌
    const isTopCard = cardIndex === cardSlots[sourceSlotIndex].cards.length - 1

    // 如果不是最顶层卡牌，不允许拖拽
    if (!isTopCard) return

    // 如果目标是垃圾桶
    if (over.id === "trash-bin") {
      // 计算当前卡槽中同类型卡牌的数量
      const sameTypeCardsInSlot = cardSlots[sourceSlotIndex].cards.filter((c) => c.type === card.type)
      const sameTypeCountInSlot = sameTypeCardsInSlot.length

      // 检查是否满足丢弃条件（当前卡槽中同类型卡牌数量 >= 10）
      if (sameTypeCountInSlot >= 10) {
        // 只从当前卡槽中移除该类型的卡牌
        const newCardSlots = [...cardSlots]
        newCardSlots[sourceSlotIndex].cards = newCardSlots[sourceSlotIndex].cards.filter((c) => c.type !== card.type)

        setCardSlots(newCardSlots)
        setShowTrashSuccess(true)
        setTimeout(() => setShowTrashSuccess(false), 2000)
      } else {
        // 显示错误信息
        setTrashError(`At least 10 cards of the same type are required to discard (Current slot: ${sameTypeCountInSlot})`)
        setTimeout(() => setTrashError(null), 3000)
      }
      return
    }

    // 如果目标是目标堆
    if (over.id === "target-stack") {
      // 检查是否已经选择了卡牌类型
      if (selectedCardType === null) {
        // 第一次选择，设置目标卡牌类型
        setSelectedCardType(card.type)
        // 移动所有相同类型的卡牌
        moveAllSameTypeCards(sourceSlotIndex, card.type, "target")
      } else if (card.type === selectedCardType) {
        // 类型匹配，移动所有相同类型的卡牌
        moveAllSameTypeCards(sourceSlotIndex, card.type, "target")
      }
    }
    // 如果目标是另一个卡槽
    else if (typeof over.id === "string" && over.id.startsWith("slot-")) {
      const targetSlotIndex = cardSlots.findIndex((slot) => slot.id === over.id)
      if (targetSlotIndex === -1 || targetSlotIndex === sourceSlotIndex) return

      // 检查目标卡槽中是否有卡牌
      if (cardSlots[targetSlotIndex].cards.length > 0) {
        // 检查目标卡槽顶部卡牌类型是否与拖拽卡牌类型一致
        const targetTopCard = cardSlots[targetSlotIndex].cards[cardSlots[targetSlotIndex].cards.length - 1]
        if (targetTopCard.type !== card.type) {
          // 类型不匹配，不允许拖拽
          return
        }
      }

      // 移动所有相同类型的卡牌到目标卡槽
      moveAllSameTypeCards(sourceSlotIndex, card.type, "slot", targetSlotIndex)
    }
  }

  const moveAllSameTypeCards = (
    sourceSlotIndex: number,
    cardType: CardType,
    targetType: "target" | "slot",
    targetSlotIndex?: number,
  ) => {
    const newCardSlots = [...cardSlots]
    const sourceSlot = newCardSlots[sourceSlotIndex]

    // 只获取从顶部开始连续的相同类型卡牌
    const topCardIndex = sourceSlot.cards.length - 1
    const consecutiveSameTypeCards: Card[] = []

    // 从顶部开始向下检查连续的相同类型卡牌
    for (let i = topCardIndex; i >= 0; i--) {
      if (sourceSlot.cards[i].type === cardType) {
        consecutiveSameTypeCards.unshift(sourceSlot.cards[i])
      } else {
        // 一旦遇到不同类型的卡牌，就停止
        break
      }
    }

    // 从源卡槽中移除这些连续的相同类型卡牌
    newCardSlots[sourceSlotIndex].cards = sourceSlot.cards.slice(
      0,
      sourceSlot.cards.length - consecutiveSameTypeCards.length,
    )

    if (targetType === "target") {
      // 添加到目标堆
      setTargetStack((prev) => [...prev, ...consecutiveSameTypeCards])
    } else if (targetType === "slot" && targetSlotIndex !== undefined) {
      // 添加到目标卡槽
      newCardSlots[targetSlotIndex].cards = [...newCardSlots[targetSlotIndex].cards, ...consecutiveSameTypeCards]
    }

    // 更新卡槽
    setCardSlots(newCardSlots)
  }

  // 获取卡牌所在的卡槽和索引
  const getCardLocation = (cardId: string): [string | null, number] => {
    for (const slot of cardSlots) {
      const cardIndex = slot.cards.findIndex((card) => card.id === cardId)
      if (cardIndex !== -1) {
        return [slot.id, cardIndex]
      }
    }
    return [null, -1]
  }

  // 获取当前拖拽的卡牌
  const getActiveCard = (): Card | null => {
    if (!activeCardId) return null

    for (const slot of cardSlots) {
      const card = slot.cards.find((card) => card.id === activeCardId)
      if (card) return card
    }

    return null
  }

  // 抽取新卡
  const handleDrawCards = () => {
    if (!accountAddress) {
      messageApi.error("Please connect your wallet first")
      return
    }
    setIsLoading(true)
    setShowDrawAnimation(true)

    // 如果超过免费次数，扣除SUI
    const currentBalance = Number(balance?.totalBalance || 0) / 1e9
    if (drawCount >= 6) {
      if (currentBalance < 0.2) {
        messageApi.error("Insufficient balance to draw cards")
        console.log("Insufficient balance to draw cards")
        setIsLoading(false)
        setShowDrawAnimation(false)
        return
      }
      previewPayment({ wallet: null })
        .onSuccess(async (result) => {
          console.log("Payment successful", result)
          setTimeout(() => {
            distributeNewCards()
            setDrawCount((prev) => prev + 1)
            setIsLoading(false)
            setTimeout(() => setShowDrawAnimation(false), 500)
          }, 1000)
        })
        .onError(async (e) => {
          console.log("Payment failed", e)
          messageApi.error(e.message)
          setIsLoading(false)
          setShowDrawAnimation(false)
        })
        .execute()
    } else {
      // 免费抽卡
      setTimeout(() => {
        distributeNewCards()
        setDrawCount((prev) => prev + 1)
        setIsLoading(false)
        setTimeout(() => setShowDrawAnimation(false), 500)
      }, 1000)
    }
  }

  // 分配新卡牌到卡槽
  const distributeNewCards = () => {
    const allCardTypes: CardType[] = [
      "wusdc",
      "wbtc",
      "wal",
      "cetus",
      "usdt",
      "sui",
      "navx",
      "deep",
      "fdusd",
      "ns",
      "blue",
      "scallop",
    ]

    // 随机选择7种卡牌类型
    const shuffledTypes = [...allCardTypes].sort(() => Math.random() - 0.5)
    const selectedTypes = shuffledTypes.slice(0, 7)

    // 保存当前使用的卡牌类型
    setCurrentCardTypes(selectedTypes)

    const newCardSlots = [...cardSlots]

    // 为每个卡槽添加4-5张新卡牌，只使用选定的7种类型
    for (let i = 0; i < newCardSlots.length; i++) {
      const cardCount = Math.floor(Math.random() * 2) + 4 // 4-5张卡牌
      for (let j = 0; j < cardCount; j++) {
        const randomType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)]
        // 改进卡牌 ID 生成，确保唯一性
        const uniqueId = `card-${i}-${j}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        newCardSlots[i].cards.push({
          id: uniqueId,
          type: randomType,
          image: `/${randomType}${randomType === "wal" || randomType === "cetus" || randomType === "blue" || randomType === "scallop" ? ".png" : ".svg"}`,
        })
      }
    }

    setCardSlots(newCardSlots)
  }

  // 提交卡组
  const handleSubmit = async (cardCount: number) => {
    if (targetStack.length === 0) {
      messageApi.warning("Please select cards first")
      return
    }

    const now = new Date()
    const currentDay = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()

    setIsLoading(true)
    previewIncentiveSubmit({ cardCount: cardCount, time: currentDay })
      .onSuccess(async (result) => {
        console.log("Submission successful", result)
        messageApi.success("Submission successful!")
        setTimeout(() => {
          setGameState("submitted")
          setIsLoading(false)
        }, 1500)
        getLatestIncentiveSubmitEvent().then((value) => {
          setPreviewResult(value ?? null)
        })
      })
      .onError(async (e) => {
        console.log("Submission failed", e)
        messageApi.error(e.message)
        setIsLoading(false)
      })
      .execute()
  }

  // 获取当前拖拽的卡牌
  const activeCard = getActiveCard()

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
      {contextHolder}
      <div className="absolute inset-0 z-[-2]">
        <BackgroundIcons />
      </div>

      {/* 顶部状态栏 */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-black/40 p-3 backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Wallet size={18} className="text-yellow-400" />
            <span className="text-sm font-medium text-white">{walletBalance.toFixed(6)} SUI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-1 rounded-full bg-indigo-600/80 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:scale-105">
              <Home size={16} />
              <span>Home</span>
            </button>
          </Link>
          <button
            onClick={() => setShowRankings(true)}
            className="flex items-center gap-1 rounded-full bg-blue-600/80 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:scale-105"
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 rounded-full bg-gray-600/50 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-gray-700 hover:scale-105"
          >
            <Info size={16} />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* 游戏界面 */}
      {gameState === "playing" && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          autoScroll={{
            enabled: true,
            threshold: {
              x: 0,
              y: 0,
            },
          }}
        >
          <div className="mx-auto max-w-6xl space-y-6">
            {/* 游戏提示 */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg p-3 backdrop-blur-md border border-white/10 shadow-lg text-center"
                >
                  <p className="text-white">
                    <Sparkles className="inline-block mr-2 h-4 w-4" />
                    Drag cards of the same type to the target area, the more cards you stack, the higher your score!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 目标卡牌堆 */}
              <div className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center">
                    <div className="w-2 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                    Target Stack
                  </h3>
                  <span className="text-xs bg-black/30 px-2 py-1 rounded-full text-blue-300 backdrop-blur-sm">
                    {selectedCardType
                      ? `Selected ${selectedCardType.toUpperCase()} card type`
                      : "Please select a card type as the target"}
                  </span>
                </div>
                <TargetStack cards={targetStack} selectedType={selectedCardType} isLocked={false} />
              </div>

              {/* 垃圾桶 */}
              <div className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center">
                    <div className="w-2 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                    Trash Bin
                  </h3>
                  <span className="text-xs bg-black/30 px-2 py-1 rounded-full text-orange-300 backdrop-blur-sm">
                    At least 10 cards of the same type are required to discard
                  </span>
                </div>
                <TrashBin error={trashError} success={showTrashSuccess} />
              </div>
            </div>

            {/* 卡牌区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center">
                  <div className="w-2 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mr-2"></div>
                  Card Area
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleDrawCards}
                        disabled={isLoading}
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg hover:shadow-blue-500/20 hover:scale-105"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Draw {drawCount >= 6 ? "(0.2 SUI)" : `(${6 - drawCount}/6 free)`}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black/80 border border-white/10 text-white">
                      <p>The first 6 draws each day are free, after that each draw costs 0.2 SUI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 抽卡动画 */}
              <AnimatePresence>
                {showDrawAnimation && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-full shadow-lg shadow-blue-500/20">
                          <RefreshCw size={40} className="text-white animate-spin" />
                        </div>
                      </div>
                      <p className="mt-4 text-xl font-bold text-white">Drawing cards...</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-7 gap-2">
                {cardSlots.map((slot) => (
                  <CardSlot key={slot.id} slot={slot} isDisabled={isLoading} selectedType={selectedCardType} />
                ))}
              </div>
            </div>
          </div>

          {/* 拖拽覆盖层 - 显示当前拖拽的卡牌 */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-30"></div>
                <img
                  src={activeCard.image || "/placeholder.svg"}
                  alt={activeCard.type}
                  className="h-16 w-16 rounded-full border-2 border-green-400 bg-black/40 p-1 shadow-lg scale-110"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* 提交按钮 */}
      {gameState === "playing" && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <motion.button
            onClick={() => handleSubmit(targetStack.length)}
            disabled={targetStack.length === 0 || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Submit Score</span>
                {targetStack.length > 0 && (
                  <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-sm">{targetStack.length} cards</span>
                )}
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* 提交成功界面 */}
      {gameState === "submitted" && (
        <div className="flex h-[70vh] flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="mb-8 rounded-2xl bg-gradient-to-b from-black/50 to-black/70 p-8 text-center backdrop-blur-md border border-white/10 shadow-lg shadow-purple-500/10 max-w-md w-full"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-10"></div>
              <Trophy className="mx-auto h-20 w-20 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            </div>

            <h2 className="mb-2 text-3xl font-bold text-white bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Submitted Successfully!
            </h2>
            <p className="mb-6 text-xl text-gray-300">
              You have successfully submitted <span className="font-bold text-white">{targetStack.length}</span> 
              <span className="font-bold text-white ml-1">{selectedCardType?.toUpperCase()}</span> cards
            </p>

            {previewResult && (
              <div className="mb-6 space-y-3 text-left bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Your Address:</p>
                  <p className="font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded-md">
                    {formatAddress(previewResult.endPlayer)}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Your Reward:</p>
                  <p className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md flex items-center">
                    <Zap size={14} className="mr-1" />
                    {Number(previewResult.endAmount) / 1_000_000_000} SUI
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Winner:</p>
                  <p className="font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded-md">
                    {formatAddress(previewResult.ownPlayer)}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">Winner Reward:</p>
                  <p className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md flex items-center">
                    <Zap size={14} className="mr-1" />
                    {Number(previewResult.ownAmount) / 1_000_000_000} SUI
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">First Player:</p>
                  <p className="font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded-md">
                    {formatAddress(previewResult.firstPlayer)}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-300">First Reward:</p>
                  <p className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md flex items-center">
                    <Zap size={14} className="mr-1" />
                    {Number(previewResult.firstAmount) / 1_000_000_000} SUI
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button
                  variant="outline"
                  className="bg-gray-800/80 text-white hover:bg-gray-700 border-white/10 rounded-full px-5 shadow-lg transition-all hover:scale-105"
                >
                  <Home size={16} className="mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Button
                onClick={() => setShowRankings(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-5 shadow-lg transition-all hover:scale-105"
              >
                <Trophy size={16} className="mr-2" />
                View Leaderboard
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 规则弹窗 */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="bg-gradient-to-b from-gray-900 to-black border-white/10 text-white rounded-xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Game Rules
            </DialogTitle>
            <DialogDescription className="text-gray-300">TokenTown Stacking Game Rules</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="mb-2 font-medium text-blue-400 flex items-center">
                <div className="w-1 h-4 bg-blue-400 rounded-full mr-2"></div>
                Basic Rules
              </h3>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    1
                  </span>
                  Start with 30 cards distributed into 7 slots
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    2
                  </span>
                  Select a card type from the slots as the target stack
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    3
                  </span>
                  Only cards of the same type can be stacked in the target slot
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    4
                  </span>
                  The first 6 draws each day are free, after that each draw costs 0.2 SUI
                </li>
              </ul>
              <h4 className="mt-3 mb-1 font-medium text-red-400 bg-red-500/10 p-2 rounded-lg">
                Before the end, players who have already submitted can submit again (the highest score will be taken)
              </h4>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="mb-2 font-medium text-green-400 flex items-center">
                <div className="w-1 h-4 bg-green-400 rounded-full mr-2"></div>
                Reward Mechanism
              </h3>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    1
                  </span>
                  If someone pays to draw cards today, the 1st place player will receive half of the vault as a reward
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    2
                  </span>
                  If someone pays to draw cards today, the last submitter will receive 1/6 of the vault as a reward
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    3
                  </span>
                  The first paid submitter will receive 1/3 of the vault as a reward
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 排行榜弹窗 */}
      <Dialog open={showRankings} onOpenChange={setShowRankings}>
        <DialogContent className="bg-gradient-to-b from-gray-900 to-black border-white/10 text-white rounded-xl shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
              Today's Leaderboard
            </DialogTitle>
          </DialogHeader>
          <Rankings />
        </DialogContent>
      </Dialog>
    </div>
  )
}
