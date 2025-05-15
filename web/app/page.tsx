"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ConnectButton } from "@mysten/dapp-kit"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Trophy, Info, Sparkles, Coins, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BackgroundIcons from "../components/background-icons"
import { getPaymentEvents, getTodayLeaderboard } from "@/contracts/query"

export default function HomeScreen() {
  const account = useCurrentAccount()
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [vaultAmount, setVaultAmount] = useState<number>(0)
  const [leaderboardCount, setLeaderboardCount] = useState(0)
  const [showLimitPrompt, setShowLimitPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 获取排行榜数据时更新长度
  useEffect(() => {
    setIsLoading(true)

    // 获取奖池金额
    const fetchVaultAmount = async () => {
      const amount = await getPaymentEvents()
      setVaultAmount(amount ?? 0)
    }

    // 获取排行榜数据
    const fetchLeaderboard = async () => {
      const events = await getTodayLeaderboard()
      setLeaderboardCount(events.length)
      setIsLoading(false)
    }

    fetchVaultAmount()
    fetchLeaderboard()
  }, [])

  // 处理游戏按钮点击
  const handleGameButtonClick = () => {
    if (leaderboardCount >= 5) {
      setShowLimitPrompt(true)
      return
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      {/* 背景图标 */}
      <div className="absolute inset-0 z-0">
        <BackgroundIcons />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="w-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            TokenTown
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105"
          >
            <Info size={16} />
            <span>游戏规则</span>
          </button>
          <ConnectButton />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 text-center"
        >
          <h1 className="text-6xl font-bold text-white drop-shadow-glow">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Token</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Town</span>
          </h1>
          <p className="mt-2 text-lg text-[#a0aec0]">区块链卡牌堆叠游戏</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 text-sm text-blue-300 border border-blue-500/20 shadow-lg shadow-blue-500/5"
            >
              <Trophy size={16} className="text-yellow-400" />
              <span>
                今日奖池: <span className="font-bold text-white">{vaultAmount}</span> SUI
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 text-sm text-purple-300 border border-purple-500/20 shadow-lg shadow-purple-500/5"
            >
              <Coins size={16} className="text-yellow-400" />
              <span>
                参与人数: <span className="font-bold text-white">{leaderboardCount}/5</span>
              </span>
            </motion.div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: account ? 1.05 : 1, boxShadow: account ? "0 0 25px rgba(66, 153, 225, 0.6)" : "none" }}
            whileTap={{ scale: account ? 0.95 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative overflow-hidden rounded-full px-16 py-4 font-bold text-white shadow-lg ${
              account ? "bg-gradient-to-r from-[#4DA2FF] to-[#0DC3A4]" : "bg-gray-400/50 cursor-not-allowed"
            }`}
            onClick={() => {
              if (!account) {
                setShowConnectPrompt(true)
              } else if (leaderboardCount >= 5) {
                setShowLimitPrompt(true)
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                <span className="relative z-10 text-xl">加载中...</span>
              </div>
            ) : account ? (
              <Link
                href={leaderboardCount < 5 ? "/game" : "#"}
                className="block w-full h-full"
                onClick={(e) => leaderboardCount >= 5 && e.preventDefault()}
              >
                <span className="relative z-10 text-xl flex items-center">
                  {leaderboardCount >= 5 ? "今日已满" : "开始游戏"}
                  <ChevronRight className="ml-1 h-5 w-5" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#0DC3A4] to-[#4DA2FF] opacity-0 transition-opacity duration-300 hover:opacity-100"></span>
              </Link>
            ) : (
              <span className="relative z-10 text-xl flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                连接钱包
              </span>
            )}
          </motion.div>

          <Dialog open={showConnectPrompt} onOpenChange={setShowConnectPrompt}></Dialog>

          {/* 新增每日限制提示弹窗 */}
          <Dialog open={showLimitPrompt} onOpenChange={setShowLimitPrompt}>
            <DialogContent className="bg-gradient-to-b from-gray-900 to-black border border-white/10 text-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  每日限制
                </DialogTitle>
                <DialogDescription className="text-gray-300">游戏参与人数已达上限</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <p>今日游戏参与人数已达到5人上限，请明天再来参与！</p>
                  <p className="mt-2">您可以查看当前排行榜，了解今日游戏情况。</p>
                </div>
                <div className="flex justify-center">
                  <Link href="/rankings">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 font-medium text-white shadow-lg"
                    >
                      <Trophy size={16} />
                      <span>查看排行榜</span>
                    </motion.button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Link href="/rankings" className="mt-6">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 border border-white/5 shadow-lg"
          >
            <Trophy size={20} />
            <span>查看排行榜</span>
          </motion.button>
        </Link>
      </div>

      {/* 规则弹窗 */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="bg-gradient-to-b from-gray-900 to-black border-white/10 text-white rounded-xl shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              游戏规则
            </DialogTitle>
            <DialogDescription className="text-gray-300">TokenTown 堆堆乐游戏规则说明</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="mb-2 font-medium text-blue-400 flex items-center">
                <div className="w-1 h-4 bg-blue-400 rounded-full mr-2"></div>
                基本规则
              </h3>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    1
                  </span>
                  初始获得30张卡牌分配至7个卡槽
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    2
                  </span>
                  从卡槽中选定一类卡牌为目标堆叠卡
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    3
                  </span>
                  只能将相同类型卡牌堆叠至目标卡槽
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-blue-500/20 text-center text-xs leading-5 mr-2">
                    4
                  </span>
                  每日前6次抽卡免费，之后每次抽卡0.2 SUI
                </li>
              </ul>
              <h4 className="mt-3 mb-1 font-medium text-red-400 bg-red-500/10 p-2 rounded-lg">
                结束之前，已经提交了的玩家可以再次提交哟（取最高成绩）
              </h4>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="mb-2 font-medium text-green-400 flex items-center">
                <div className="w-1 h-4 bg-green-400 rounded-full mr-2"></div>
                奖励机制
              </h3>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    1
                  </span>
                  若当日有人付费抽卡，排名第1名玩家可获得金库一半的奖励
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    2
                  </span>
                  若当日有人付费抽卡，作为激励最后提交者可获得1/6金库奖励
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500/20 text-center text-xs leading-5 mr-2">
                    3
                  </span>
                  第一位付费提交者可获得1/3金库奖励
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
