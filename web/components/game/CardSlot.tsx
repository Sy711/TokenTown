"use client";
import { useDroppable } from "@dnd-kit/core";
import DraggableCard from "./DraggableCard";
import type { CardSlots, CardType } from "@/types/game-types";

export default function CardSlot({
  slot,
  isDisabled,
  selectedType,
}: {
  slot: CardSlots;
  isDisabled: boolean;
  selectedType: CardType | null;
}) {
    // 使卡槽可以接收拖拽
    const { setNodeRef } = useDroppable({
      id: slot.id,
      disabled: isDisabled,
    })
  
    return (
      <div className="flex flex-col items-center space-y-1">
        <div ref={setNodeRef} className="h-28 w-full rounded-lg bg-yellow-900/20 p-1">
          <div className="relative h-full w-full">
            {slot.cards.map((card, index) => (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                total={slot.cards.length}
                isDisabled={isDisabled}
                sameTypeCount={slot.cards.filter((c) => c.type === card.type).length}
              />
            ))}
          </div>
        </div>
      </div>
    )
}