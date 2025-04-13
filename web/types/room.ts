export type RoomStatus = 'waiting' | 'matched';

export interface BattleRoom {
  room_id: string;
  player1: string;
  player2?: string;
  status: RoomStatus;
  created_at: number;
}
