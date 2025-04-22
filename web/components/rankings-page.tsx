"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Wallet, Users, Info } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function RankingsPage() {
  const [isLoading, setIsLoading] = useState(true)

  // 排行榜数据
  const todayRankings = [
    { rank: 1, player: "Player123", cards: 12, reward: "2.5 SUI", isLastSubmitter: false },
    { rank: 2, player: "CryptoKing", cards: 10, reward: "1.5 SUI", isLastSubmitter: false },
    { rank: 3, player: "BlockMaster", cards: 9, reward: "1.0 SUI", isLastSubmitter: true },
    { rank: 4, player: "TokenFan", cards: 8, reward: "0.5 SUI", isLastSubmitter: false },
    { rank: 5, player: "SuiLover", cards: 7, reward: "0.3 SUI", isLastSubmitter: false },
    { rank: 6, player: "Web3Gamer", cards: 6, reward: "0.0 SUI", isLastSubmitter: false },
    { rank: 7, player: "CryptoFan", cards: 5, reward: "0.0 SUI", isLastSubmitter: false },
    { rank: 8, player: "BlockFan", cards: 4, reward: "0.0 SUI", isLastSubmitter: false },
  ]

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
      {/* 顶部状态栏 */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-black/30 p-3 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 text-white">
          <ArrowLeft size={18} />
          <span className="font-medium">返回</span>
        </Link>
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-white">限制名额: 20名</span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-yellow-400" />
          <span className="text-sm font-medium text-white">10.5 SUI</span>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">TokenTown 排行榜</h1>
          <p className="mt-1 text-gray-300">当前金库总额: 25.6 SUI</p>
        </div>

        <Card className="w-full bg-black/20 p-4 mt-4">
          <h2 className="text-xl font-bold text-white mb-4 text-center">今日排行</h2>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-lg bg-blue-900/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-400" />
                    <span className="text-sm text-gray-300">仅限前20名玩家参与游戏</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    您的排名: <span className="font-medium text-white">3</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4">
                <div className="mb-3 grid grid-cols-12 text-xs font-medium text-white">
                  <div className="col-span-1">排名</div>
                  <div className="col-span-4">玩家</div>
                  <div className="col-span-3">卡牌数</div>
                  <div className="col-span-4">预计奖励</div>
                </div>
                <div className="space-y-2">
                  {todayRankings.map((item) => (
                    <div
                      key={item.rank}
                      className={`grid grid-cols-12 items-center rounded py-2 text-sm ${
                        item.rank === 3 ? "bg-blue-900/30" : ""
                      }`}
                    >
                      <div className="col-span-1 font-bold text-white">{item.rank}</div>
                      <div className="col-span-4 flex items-center gap-1 text-white">
                        {item.player}
                        {item.isLastSubmitter && (
                          <span className="rounded bg-purple-500/30 px-1 py-0.5 text-xs text-purple-300">最后提交</span>
                        )}
                      </div>
                      <div className="col-span-3 text-white">{item.cards}张</div>
                      <div className="col-span-4 font-medium text-green-400">{item.reward}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link href="/game">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:from-blue-600 hover:to-purple-700"
                  >
                    继续游戏
                  </motion.button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
