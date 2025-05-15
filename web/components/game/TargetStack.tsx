"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { Card, CardType } from "@/types/game-types"
import { Target } from "lucide-react"

interface TargetStackProps {
  cards: Card[]
  selectedType: CardType | null
  isLocked: boolean
}

export default function TargetStack({ cards, selectedType, isLocked }: TargetStackProps) {
  const { setNodeRef } = useDroppable({
    id: "target-stack",
    disabled: isLocked,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition-all relative overflow-hidden group",
        selectedType
          ? "border-green-500/50 bg-gradient-to-br from-green-900/20 to-emerald-900/10"
          : "border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-amber-900/10",
        isLocked && "border-gray-500/50 bg-gradient-to-br from-gray-900/20 to-gray-800/10",
      )}
    >
      {/* 背景效果 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-0"></div>

      {/* 发光效果 */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          selectedType ? "bg-green-500/5" : "bg-yellow-500/5",
        )}
      ></div>

      {cards.length === 0 ? (
        <div className="text-center text-gray-400 z-10 flex flex-col items-center">
          {isLocked ? (
            <span className="bg-gray-800/80 px-3 py-1 rounded-full text-sm backdrop-blur-sm">已锁定</span>
          ) : (
            <>
              <Target className="h-8 w-8 mb-2 text-yellow-500/70" />
              <span className="bg-black/50 px-3 py-1 rounded-full text-sm backdrop-blur-sm">拖拽卡牌到这里</span>
            </>
          )}
        </div>
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="relative h-full flex items-center">
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0, y: -20 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    x: `${index * 15}px`,
                    zIndex: index,
                    transition: { type: "spring", damping: 12, stiffness: 200 },
                  }}
                  exit={{ scale: 0, y: -20 }}
                  className="absolute left-0"
                  style={{ zIndex: index }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm"></div>
                    <img
                      src={card.image || "/placeholder.svg"}
                      alt={card.type}
                      className="h-16 w-16 rounded-full border-2 border-white/30 bg-black/60 p-1 shadow-lg"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute right-4 bottom-4 z-20">
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white shadow-lg border border-white/10">
              <span className="text-green-400">{cards.length}</span> 张
            </span>
          </div>

          {/* 类型标识 */}
          {selectedType && (
            <div className="absolute left-4 bottom-4 z-20">
              <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white shadow-lg border border-white/10">
                <img
                  src={`/${selectedType}${selectedType === "wal" || selectedType === "cetus" || selectedType === "blue" || selectedType === "scallop" ? ".png" : ".svg"}`}
                  alt={selectedType}
                  className="h-4 w-4"
                />
                {selectedType.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
