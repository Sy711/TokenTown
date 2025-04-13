import { Transaction } from "@mysten/sui/transactions";
import { createBetterTxFactory } from "./index";

// 示例：封装创建房间的方法
export const createRoom = createBetterTxFactory<{
  wallet: string;
}>((tx, networkVariables, { wallet }) => {
  tx.moveCall({
    target: `${networkVariables.Package}::card::create_room`,
    arguments: [
      tx.object(wallet),
      tx.pure(0), // 可以根据需要添加其他参数
    ],
  });
  return tx;
});

// 示例：封装加入房间的方法
export const joinRoom = createBetterTxFactory<{
  wallet: string;
  rank: number;
}>((tx, networkVariables, { wallet, rank }) => {
  tx.moveCall({
    target: `${networkVariables.Package}::card::join_existing_room`,
    arguments: [
      tx.object(wallet),
      tx.pure(rank),
    ],
  });
  return tx;
});

// 示例：封装发牌的方法
export const dealCard = createBetterTxFactory<{
  wallet: string;
  rank: number;
}>((tx, networkVariables, { wallet, rank }) => {
  tx.moveCall({
    target: `${networkVariables.Package}::card::deal_card`,
    arguments: [
      tx.object(wallet),
      tx.pure(rank),
    ],
  });
  return tx;
});

// 示例：封装提交结果的方法
export const submitResult = createBetterTxFactory<{
  wallet: string;
  rank: number;
  player1: string;
  player2: string;
  count1: number;
  count2: number;
}>((tx, networkVariables, { wallet, rank, player1, player2, count1, count2 }) => {
  tx.moveCall({
    target: `${networkVariables.Package}::card::submit`,
    arguments: [
      tx.object(wallet),
      tx.pure(rank),
      tx.pure(player1),
      tx.pure(player2),
      tx.pure(count1),
      tx.pure(count2),
    ],
  });
  return tx;
});

// 示例：封装领取奖励的方法
export const claimReward = createBetterTxFactory<{
  rank: number;
}>((tx, networkVariables, { rank }) => {
  tx.moveCall({
    target: `${networkVariables.Package}::card::claim`,
    arguments: [
      tx.pure(rank),
    ],
  });
  return tx;
}); 