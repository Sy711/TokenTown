"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ConnectButton } from '@mysten/dapp-kit'
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Trophy, Info } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BackgroundIcons from "../components/background-icons"
// import {vaultBalance}from "@/contracts/query";

export default function HomeScreen() {
  const account = useCurrentAccount();
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [vaultAmount, setVaultAmount] = useState<number>(0)

  // 删除 isConnected 状态
  // vaultBalance({}).then((value) => {
  //   setVaultAmount(value ?? 0);
  // });
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      {/* 背景图标 */}
      <div className="absolute inset-0 z-0">
        <BackgroundIcons />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="text-xl font-bold text-white">TokenTown</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
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
          <h1 className="text-5xl font-bold text-white drop-shadow-glow">TokenTown</h1>
          <p className="mt-2 text-lg text-[#a0aec0]">区块链卡牌堆叠游戏</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
              <Trophy size={14} />
              <span>今日奖池: {vaultAmount} SUI</span>
            </div>

          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: account ? 1.05 : 1, boxShadow: account ? "0 0 25px rgba(66, 153, 225, 0.6)" : "none" }}
            whileTap={{ scale: account ? 0.95 : 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className={`relative overflow-hidden rounded-full px-16 py-4 font-bold text-white shadow-lg ${account ? "bg-gradient-to-r from-[#4DA2FF] to-[#0DC3A4]" : "bg-gray-400/50 cursor-not-allowed"
              }`}
            onClick={() => !account && setShowConnectPrompt(true)}
          >
            {account ? (
              <Link href="/game">
                <span className="relative z-10 text-xl">开始游戏</span>
              </Link>
            ) : (
              <span className="relative z-10 text-xl">开始游戏</span>
            )}
          </motion.button>

          <Dialog open={showConnectPrompt} onOpenChange={setShowConnectPrompt}>
            
          </Dialog>
        </div>
        <Link href="/rankings">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Trophy size={20} />
              <span>查看排行榜</span>
            </motion.button>
          </Link>
      </div>


      {/* 规则弹窗 */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">游戏规则</DialogTitle>
            <DialogDescription className="text-gray-300">TokenTown 堆堆乐游戏规则说明</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-1 font-medium text-blue-400">基本规则</h3>
              <p>1. 初始获得30张卡牌分配至7个卡槽</p>
              <p>2. 从卡槽中选定一类卡牌为目标堆叠卡</p>
              <p>3. 只能将相同类型卡牌堆叠至目标卡槽</p>
              <p>4. 每日前6次抽卡免费，之后每次抽卡0.2 SUI</p>
              <p>5. 每日22:00停止提交，结算当天排名</p>
            </div>
            <div>
              <h3 className="mb-1 font-medium text-blue-400">奖励机制</h3>
              <p>1. 排名前5名玩家可获得金库奖励</p>
              <p>2. 若当日有人付费抽卡，最后提交者可获得1/5金库奖励</p>
              <p>3. 奖励将在次日自动发放至您的钱包</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

