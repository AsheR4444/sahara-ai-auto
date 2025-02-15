import Table from "cli-table3"

import { getWallets } from "@/db"
import { Client, Networks } from "@/eth-async"
import { GlobalClient } from "@/GlobalClient"
import { logger } from "@/helpers"

type WalletInfo = {
  name: string;
  balance: string;
  txCount: string;
  shardsAmount: string;
}

const saharaGetBalances = async () => {
  const wallets = await getWallets()

  const walletsDataPromises = wallets.map(async (wallet): Promise<WalletInfo> => {
    try {
      const client = new Client(wallet.privateKey, Networks.SaharaAI, wallet.proxy)
      const globalClient = new GlobalClient({ name: wallet.name, evmClient: client, ref: wallet.refCode, proxy: wallet.proxy })

      const [balance, txCount, shardsAmount] = await Promise.all([
        client.wallet.balance(),
        client.provider.getTransactionCount(client.signer.address),
        globalClient.sahara.getShardsAmount(),
      ])

      return {
        name: wallet.name,
        balance: balance.Ether.toFixed(4),
        txCount: txCount.toString(),
        shardsAmount: shardsAmount.toString(),
      }
    } catch (error) {
      logger.error(`Failed to get data for ${wallet.name}: ${error}`)
      return {
        name: wallet.name,
        balance: "Error",
        txCount: "-",
        shardsAmount: "-",
      }
    }
  })

  const walletsData = await Promise.all(walletsDataPromises)

  const table = new Table({
    head: ["Name", "Balance", "Transactions", "Shards Amount"],
    style: {
      head: ["green"],
      border: ["white"],
    },
  })
  walletsData.forEach(data => {
    table.push([
      data.name,
      data.balance,
      data.txCount,
      data.shardsAmount,
    ])
  })

  console.log(table.toString())
}

export { saharaGetBalances }
