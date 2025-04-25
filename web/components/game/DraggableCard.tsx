"use client";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Card } from "@/types/game-types";

export default function DraggableCard({
  card,
  index,
  total,
  isDisabled,
  sameTypeCount,
}: {
  card: Card;
  index: number;
  total: number;
  isDisabled: boolean;
  sameTypeCount: number;
}) {// 检查是否是最顶层的卡牌
    const isTopCard = index === total - 1
  
    // 只有最顶层的卡牌可以拖拽
    const isDraggableDisabled = isDisabled || !isTopCard
  
    console.log(`Card ${card.id}: isTop=${isTopCard}, isDisabledProp=${isDisabled}, finalDisabled=${isDraggableDisabled}`); // <--- 添加日志检查状态
  
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: card.id,
      disabled: isDraggableDisabled, // <--- 确认这个值是否为 false
      // disabled: false, // <--- 或者临时强制改为 false 测试
    })
  
    // 计算卡牌在卡槽中的位置
    const offset = index * 5 // 每张卡片偏移5px
  
    // 检查是否有多张相同类型的卡牌
    const hasMultipleSameType = sameTypeCount > 1
  
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "absolute left-0 top-0 transition-transform",
          isDragging ? "z-50 cursor-grabbing" : isTopCard ? "cursor-grab" : "cursor-default",
          isDraggableDisabled && "pointer-events-none opacity-50",
        )}
        style={{
          transform: `translateY(${offset}px)`,
          zIndex: index,
        }}
      >
        <img
          src={card.image || "/placeholder.svg"}
          alt={card.type}
          className={cn(
            "h-16 w-16 rounded-full border-2 bg-black/40 p-1 shadow-lg transition-all",
            isDragging ? "border-green-400 scale-110" : "border-white/20",
            isDraggableDisabled ? "border-gray-500/50" : "",
          )}
        />
        {isTopCard && hasMultipleSameType && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            {sameTypeCount}
          </div>
        )}
      </div>
    )
}