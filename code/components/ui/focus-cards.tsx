"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onClick,
    overlayColor,
    textColor,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onClick?: (index: number) => void;
    overlayColor?: string;
    textColor?: string;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onClick?.(index)}
      className={cn(
        "rounded-xl relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-80 w-full transition-all duration-300 ease-out cursor-pointer border-2 border-transparent hover:border-foreground",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 w-full h-full"
      />
      <div
        className={cn(
          "absolute inset-0 flex items-end py-6 px-6 transition-opacity duration-300",
          overlayColor || "bg-black/50",
          hovered === index ? "opacity-100" : "opacity-0"
        )}
      >
        <div className={cn("text-2xl md:text-3xl font-semibold", textColor || "text-white")}>
          {card.title}
        </div>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
};

export function FocusCards({ 
  cards, 
  onCardClick,
  overlayColors,
  textColors,
}: { 
  cards: Card[];
  onCardClick?: (index: number) => void;
  overlayColors?: Record<number, string>;
  textColors?: Record<number, string>;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          onClick={onCardClick}
          overlayColor={overlayColors?.[index]}
          textColor={textColors?.[index]}
        />
      ))}
    </div>
  );
}
