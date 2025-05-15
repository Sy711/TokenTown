"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { Trash2, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TrashBinProps {
  error: string | null
  success: boolean
}

export default function TrashBin({ error, success }: TrashBinProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash-bin",
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all relative overflow-hidden group",
        error
          ? "border-red-500 bg-gradient-to-br from-red-900/20 to-red-800/10"
          : isOver
            ? "border-yellow-500 bg-gradient-to-br from-yellow-900/30 to-amber-900/20"
            : "border-gray-500/50 bg-gradient-to-br from-gray-800/30 to-gray-900/20",
        success && "border-green-500 bg-gradient-to-br from-green-900/20 to-emerald-900/10",
      )}
    >
      {/* 背景效果 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-0"></div>

      {/* 发光效果 */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          error ? "bg-red-500/5" : success ? "bg-green-500/5" : "bg-gray-500/5",
        )}
      ></div>

      <div className="z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="bg-red-500/20 p-2 rounded-full mb-2">
                <X size={24} className="text-red-400" />
              </div>
              <p className="text-center text-xs text-red-400 px-4 max-w-[200px]">{error}</p>
            </motion.div>
          ) : success ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="bg-green-500/20 p-2 rounded-full mb-2">
                <Check size={24} className="text-green-400" />
              </div>
              <p className="text-center text-xs text-green-400">丢弃成功!</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  "p-2 rounded-full mb-2 transition-all",
                  isOver ? "bg-yellow-500/20" : "bg-gray-500/20",
                  "group-hover:scale-110",
                )}
              >
                <Trash2 size={24} className={cn("transition-colors", isOver ? "text-yellow-400" : "text-gray-400")} />
              </div>
              <p className="text-center text-xs text-gray-400">
                拖拽卡牌到此处丢弃
                <br />
                <span className="text-green-400 font-medium">绿色标记</span>表示可丢弃(≥10张)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
