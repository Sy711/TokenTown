"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import DraggableCard from "./DraggableCard"
import type { CardSlots, CardType } from "@/types/game-types"
import { motion } from "framer-motion"

interface CardSlotProps {
  slot: CardSlots
  isDisabled: boolean
  selectedType: CardType | null
}

export default function CardSlot({ slot, isDisabled, selectedType }: CardSlotProps) {
  // 使卡槽可以接收拖拽
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    disabled: isDisabled,
  })

  // 计算每种卡牌类型的数量
  const typeCountMap: Partial<Record<CardType, number>> = {} // 修改: 使用 Partial 使属性变为可选
  slot.cards.forEach((card) => {
    typeCountMap[card.type] = (typeCountMap[card.type] || 0) + 1
  })

  // 获取卡牌类型和数量的数组，并按数量降序排序
  const typeCountArray = Object.entries(typeCountMap)
    // 修改: 使用非空断言 count! 因为我们知道 count 在这里不可能是 undefined
    .map(([type, count]) => ({ type: type as CardType, count: count! })) 
    .sort((a, b) => b.count - a.count)

  // 获取从顶层开始连续的某类型卡牌数量
  const getTopConsecutiveCount = (type: CardType) => {
    let count = 0
    for (let i = slot.cards.length - 1; i >= 0; i--) {
      if (slot.cards[i].type === type) {
        count++
      } else {
        break
      }
    }
    return count
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        ref={setNodeRef}
        className={cn(
          "h-32 w-full rounded-xl bg-gradient-to-br from-yellow-900/20 to-amber-900/10 p-1 relative transition-all duration-300 border border-yellow-500/20",
          isOver && "from-yellow-900/30 to-amber-900/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10",
          slot.cards.length === 0 && "border-dashed",
        )}
      >
        <div className="relative h-full w-full">
          {slot.cards.map((card, index) => {
            const isTopCard = index === slot.cards.length - 1
            const topConsecutiveCount = isTopCard ? getTopConsecutiveCount(card.type) : 1
            return (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                total={slot.cards.length}
                isDisabled={isDisabled}
                sameTypeCount={topConsecutiveCount}
                selectedType={selectedType}
              />
            )
          })}

          {/* 空卡槽提示 */}
          {slot.cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-yellow-500/50 text-xs">空卡槽</div>
          )}
        </div>

        {/* 卡牌类型统计 */}
        {typeCountArray.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-1 p-1 bg-black/70 rounded-b-lg backdrop-blur-sm border-t border-white/5"
          >
            {typeCountArray.map(({ type, count }) => (
              <div
                key={type}
                className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 transition-all",
                  count >= 10
                    ? "bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white shadow-sm shadow-green-500/20"
                    : "bg-gray-700/80 text-gray-300",
                  selectedType === type && "ring-1 ring-white",
                )}
              >
                <img
                  src={`/${type}${type === "wal" || type === "cetus" || type === "blue" || type === "scallop" ? ".png" : ".svg"}`}
                  alt={type}
                  className="w-2.5 h-2.5"
                />
                <span>{count}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
