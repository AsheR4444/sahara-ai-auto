import { getWallets } from "@/db"
import { Client, Networks } from "@/eth-async"
import { GlobalClient } from "@/GlobalClient"
import { checkProxy,getRandomNumber, logger, shuffleArray, sleep  } from "@/helpers"
import { SaharaDailyTasks } from "@/sahara"

const galxeGobiBearDaily = async (client: GlobalClient) => {
  await client.galxe.handleVisitPageTask({ taskId: "507361624877694976", campaignId: "GCNLYtpFM5" })
  await sleep(getRandomNumber(2, 5, true))
  await client.galxe.handleVisitPageTask({ taskId: "505649247018811392", campaignId: "GCNLYtpFM5" })

  await sleep(getRandomNumber(2, 5, true))

  await client.galxe.claimTask("505649247018811392")
  await sleep(getRandomNumber(2, 5, true))
  await client.galxe.claimTask("507361624877694976")
}

const handleGalxeGobiBearDaily = async () => {
  const wallets = shuffleArray(await getWallets())

  const promises: Promise<void>[] = []

  for (const wallet of wallets) {
    if (!wallet.proxy) {
      logger.error(`Wallet ${wallet.name} has no proxy configured, skipping...`)
      continue
    }

    const proxyCheck = await checkProxy(wallet.proxy)
    if (!proxyCheck.isWorking) {
      logger.error(`Proxy check failed for wallet ${wallet.name}: ${proxyCheck.error}`)
      continue
    }

    const client = new GlobalClient({ name: wallet.name, evmClient: new Client(wallet.privateKey, Networks.SaharaAI, wallet.proxy), ref: wallet.refCode || "", proxy: wallet.proxy })

    promises.push(galxeGobiBearDaily(client))
  }

  await Promise.all(promises)
}

const gobiBearDaily = async (client: GlobalClient) => {
  await client.sahara.claimTask(SaharaDailyTasks.VisitXTask)
  await sleep(getRandomNumber(2, 5, true))
  await client.sahara.claimTask(SaharaDailyTasks.VisitBlogTask)
}

const handleGobiBearDaily = async () => {
  const wallets = shuffleArray(await getWallets())

  const promises: Promise<void>[] = []

  for (const wallet of wallets) {
    if (!wallet.proxy) {
      logger.error(`Wallet ${wallet.name} has no proxy configured, skipping...`)
      continue
    }

    const proxyCheck = await checkProxy(wallet.proxy)
    if (!proxyCheck.isWorking) {
      logger.error(`Proxy check failed for wallet ${wallet.name}: ${proxyCheck.error}`)
      continue
    }

    const client = new GlobalClient({ name: wallet.name, evmClient: new Client(wallet.privateKey, Networks.SaharaAI, wallet.proxy), ref: wallet.refCode || "", proxy: wallet.proxy })

    promises.push(gobiBearDaily(client))
  }

  await Promise.all(promises)
}

export { galxeGobiBearDaily, gobiBearDaily, handleGalxeGobiBearDaily, handleGobiBearDaily }
