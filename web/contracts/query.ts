import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient ,networkConfig,createBetterTxFactory,createBetterDevInspect} from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import {DailyLeaderboardEvent,IncentiveSubmitPreviewResult} from "@/types/game-types";
import dayjs from 'dayjs';

export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

// 新增支付事件查询
export const queryPaymentEvents = async () => {
  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: `${networkConfig.testnet.variables.package}::card::PaymentEvent`
    }
  });
  return events.data.map(event => event.parsedJson as { amount: string });
};

// 修改后的每日排行榜事件查询
export const getTodayLeaderboard = async (): Promise<DailyLeaderboardEvent[]> => {
  const eventType = `${networkConfig.testnet.variables.package}::card::DailyLeaderboardEvent`;

  // 获取当前时间范围
  const startOfDay = dayjs().startOf('day').unix(); // 秒级时间戳
  const endOfDay = dayjs().endOf('day').unix();

  const response = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 100, // 可调整
  });

  const todayEvents: DailyLeaderboardEvent[] = [];

  for (const event of response.data) {
    const parsed = event.parsedJson as DailyLeaderboardEvent;
    const timestampMs = Number(event.timestampMs); // 毫秒级时间戳

    const tsSec = Math.floor(timestampMs / 1000);
    if (tsSec >= startOfDay && tsSec <= endOfDay) {
      todayEvents.push(parsed);
    }
  }

  // 可排序
  return todayEvents.sort((a, b) => Number(BigInt(b.card_count) - BigInt(a.card_count)));
};

export const getTodayFirstSubmitter = async (): Promise<string | null> => {
  const eventType = `${networkConfig.testnet.variables.package}::card::FirstEvent`;

  const events = await suiClient.queryEvents({
    query: {
      MoveEventType: eventType,
    },
    limit: 1,
    order: "descending", // 最新的在最前
  });

  const latest = events.data[0];
  if (!latest) return null;

  const parsed = latest.parsedJson as { player: string };
  return parsed.player;
};

// 新增支付交易构建器
import { bcs } from "@mysten/sui/bcs";
import { DevInspectResults } from "@mysten/sui/client";

export const previewPaymentTx = createBetterDevInspect<
  { amount: string; vault: string },
  number
>(
  (tx, networkVariables, params) => {
    tx.moveCall({
      package: networkVariables.package,
      module: "card",
      function: "payment",
      arguments: [
        tx.object(params.vault),
        tx.object(networkVariables.state),
        tx.pure.u64(params.amount),
      ],
    });
    return tx;
  },
  (res: DevInspectResults) => {
    const value = res?.results?.[0]?.returnValues?.[0]?.[0];
    if (!value) return null;

    const parsed = bcs.U64.parse(new Uint8Array(value));
    return Number(parsed);
  }
);


// 卡牌提交交易构建器
export const createSubmitTx = createBetterTxFactory<{
  vault: string;
  cardCount: number;
}>((tx, networkVariables, params) => {
  tx.moveCall({
    package: networkVariables.package,
    module: "card",
    function: "submit",
    arguments: [
      tx.object(params.vault),
      tx.pure.u64(params.cardCount.toString()),
      tx.object(networkVariables.state)
    ]
  });
  return tx;
});

// 激励结算交易构建器 
export const previewIncentiveSubmitTx = createBetterDevInspect<
  {
    vault: string;
    cardCount: number;
  },
  IncentiveSubmitPreviewResult | null // 明确返回类型可能为 null
>(
  (tx, networkVariables, params) => {
    tx.moveCall({
      package: networkVariables.package,
      module: "card",
      function: "incentive_submit",
      arguments: [
        tx.object(params.vault),
        tx.pure.u64(params.cardCount.toString()),
        tx.object(networkVariables.state),
      ],
    });
    return tx;
  },
  (res: DevInspectResults): IncentiveSubmitPreviewResult | null => { // 明确返回类型
    const raw = res?.results?.[0]?.returnValues?.[0]?.[0];
    if (!raw) return null;

    const bytes = new Uint8Array(raw);

    // 使用 bcs.struct 定义元组的结构进行解析
    // 注意：字段名称是自定义的，但顺序和类型必须与 Move 返回的元组完全一致
    const IncentiveSubmitResultParser = bcs.struct('IncentiveSubmitResultTuple', {
        endPlayer: bcs.Address,
        endAmount: bcs.U64,
        ownPlayer: bcs.Address,
        ownAmount: bcs.U64,
        firstPlayer: bcs.Address,
        firstAmount: bcs.U64,
    });

    try {
        // 使用定义的结构解析器来解析字节数据
        const parsedData = IncentiveSubmitResultParser.parse(bytes);

        // 提取解析后的值
        const { endPlayer, endAmount, ownPlayer, ownAmount, firstPlayer, firstAmount } = parsedData;

        return {
          endPlayer: String(endPlayer), // 确保类型为 string
          endAmount: Number(endAmount), // 将 bcs.U64 (BigInt) 转换为 number
          ownPlayer: String(ownPlayer),
          ownAmount: Number(ownAmount), // 将 bcs.U64 (BigInt) 转换为 number
          firstPlayer: String(firstPlayer),
          firstAmount: Number(firstAmount), // 将 bcs.U64 (BigInt) 转换为 number
        };
    } catch (error) {
        console.error("Failed to parse incentive_submit return value with bcs.struct:", error);
        return null; // 解析失败返回 null
    }
  }
);