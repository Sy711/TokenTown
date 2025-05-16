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
  nextDifferentCard?: Card | null
}

export default function DraggableCard({
  card,
  index,
  total,
  isDisabled,
  sameTypeCount,
  selectedType,
  nextDifferentCard,
}: DraggableCardProps) {
  const isTopCard = index === total - 1
  const isDraggableDisabled = isDisabled || !isTopCard
  const offset = index * 5 // 减少偏移量
  const hasMultipleSameType = sameTypeCount > 1
  const isMatchingSelectedType = selectedType === card.type
  const isDiscardable = sameTypeCount >= 10

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: isDraggableDisabled,
  })

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-0 top-0 transition-all duration-150",
        isDragging ? "z-50 cursor-grabbing" : isTopCard ? "cursor-grab" : "cursor-default",
        isDraggableDisabled && "pointer-events-none",
        isTopCard && "hover:scale-105",
      )}
      style={{
        transform: `translateY(${offset}px)`,
        zIndex: index,
        opacity: isDraggableDisabled ? 0.7 : 1,
        willChange: "transform",
      }}
      whileHover={isTopCard ? {} : {}}
      animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
    >
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-md opacity-0 transition-opacity duration-150",
            isDragging && "opacity-50",
            isMatchingSelectedType && "bg-green-500/20 opacity-30",
            isDiscardable && "bg-yellow-500/20 opacity-30",
          )}
        ></div>

        <img
          src={card.image || "/placeholder.svg"}
          alt={card.type}
          className={cn(
            "h-20 w-20 rounded-full border-2 bg-black/60 p-1 shadow-lg transition-all",
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

        {isTopCard && (
          <div className="absolute -left-1 -bottom-1 h-4 w-4 rounded-full bg-black/70 flex items-center justify-center border border-white/10">
            <img
              src={`/${card.type}${card.type === "wal" || card.type === "cetus" || card.type === "blue" || card.type === "scallop" ? ".png" : ".svg"}`}
              alt={card.type}
              className="h-2.5 w-2.5"
            />
          </div>
        )}

        {isTopCard && nextDifferentCard && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
            <div className="relative">
              <div className="absolute inset-0 bg-black/50 rounded-full blur-sm"></div>
              <img
                src={nextDifferentCard.image || "/placeholder.svg"}
                alt={nextDifferentCard.type}
                className="h-8 w-8 rounded-full border border-white/20 bg-black/40 p-0.5"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
