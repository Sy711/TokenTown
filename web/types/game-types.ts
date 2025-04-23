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
  card_count: bigint;
};

export type typequeryEndEvents ={
  end_player: string;
    end_amount: bigint;
    own_player: string;
    own_amount: bigint;
    frist_player: string;
    first_amount: bigint;
}
export interface IncentiveSubmitPreviewResult {
  endPlayer: string;
  endAmount: number;
  ownPlayer: string;
  ownAmount: number;
  firstPlayer: string;
  firstAmount: number;
 
}