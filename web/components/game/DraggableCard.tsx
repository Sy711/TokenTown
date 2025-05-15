"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { Card, CardType } from "@/types/game-types"
import { motion } from "framer-motion"

interface DraggableCardProps {
  card: Card
  index: number
  total: number
  isDisabled: boolean
  sameTypeCount: number
  selectedType: CardType | null
}

export default function DraggableCard({
  card,
  index,
  total,
  isDisabled,
  sameTypeCount,
  selectedType,
}: DraggableCardProps) {
  // 检查是否是最顶层的卡牌
  const isTopCard = index === total - 1

  // 只有最顶层的卡牌可以拖拽
  const isDraggableDisabled = isDisabled || !isTopCard

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: isDraggableDisabled,
  })

  // 计算卡牌在卡槽中的位置
  const offset = index * 5 // 每张卡片偏移5px

  // 检查是否有多张相同类型的卡牌
  const hasMultipleSameType = sameTypeCount > 1

  // 检查是否与选定类型匹配
  const isMatchingSelectedType = selectedType === card.type

  // 检查是否可以丢弃（10张或以上）
  const isDiscardable = sameTypeCount >= 10

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-0 top-0 transition-all duration-200",
        isDragging ? "z-50 cursor-grabbing" : isTopCard ? "cursor-grab" : "cursor-default",
        isDraggableDisabled && "pointer-events-none",
        isTopCard && "hover:scale-105",
      )}
      style={{
        transform: `translateY(${offset}px)`,
        zIndex: index,
        opacity: isDraggableDisabled ? 0.7 : 1,
      }}
      whileHover={isTopCard ? { y: offset - 5 } : {}}
      animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
    >
      <div className="relative">
        {/* 发光效果 - 根据卡牌类型和状态变化 */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-md opacity-0 transition-opacity duration-300",
            isDragging && "opacity-70",
            isMatchingSelectedType && "bg-green-500/30 opacity-50",
            isDiscardable && "bg-yellow-500/30 opacity-50",
          )}
        ></div>

        <img
          src={card.image || "/placeholder.svg"}
          alt={card.type}
          className={cn(
            "h-16 w-16 rounded-full border-2 bg-black/60 p-1 shadow-lg transition-all",
            isDragging
              ? "border-green-400 scale-110"
              : isMatchingSelectedType
                ? "border-green-400/70"
                : isDiscardable
                  ? "border-yellow-400/70"
                  : "border-white/20",
            isDisabled ? "border-gray-500/50" : "",
          )}
        />

        {/* 卡牌数量指示器 */}
        {isTopCard && hasMultipleSameType && (
          <div
            className={cn(
              "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-md",
              isDiscardable
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : isMatchingSelectedType
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-blue-400 to-purple-400",
            )}
          >
            {sameTypeCount}
          </div>
        )}

        {/* 卡牌类型指示器 - 仅在顶部卡牌显示 */}
        {isTopCard && (
          <div className="absolute -left-1 -bottom-1 h-4 w-4 rounded-full bg-black/70 flex items-center justify-center border border-white/10">
            <img
              src={`/${card.type}${card.type === "wal" || card.type === "cetus" || card.type === "blue" || card.type === "scallop" ? ".png" : ".svg"}`}
              alt={card.type}
              className="h-2.5 w-2.5"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
