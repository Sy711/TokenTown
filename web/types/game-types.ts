export type CardType = "wusdc" | "wbtc" | "wal" | "cetus" | "usdt" | "sui" | "navx" | "deep";

export interface Card {
  id: string;
  type: CardType;
  image: string;
}

export interface CardSlots {
  id: string;
  cards: Card[];
}
export type DailyLeaderboardEvent = {
  player: string;
  cardCount: bigint;
};


export interface IncentiveSubmitPreviewResult {
  endPlayer: string;
  endAmount: bigint;
  ownPlayer: string;
  ownAmount: bigint;
  firstPlayer: string;
  firstAmount: bigint;
 
}