import { THREADS } from "@/app"
import { getWallets } from "@/db"
import { GlobalClient } from "@/GlobalClient"
import { getRandomNumber, shuffleArray, sleep } from "@/helpers"
import { runWithConcurrency } from "@/helpers/executor"
import { processWallets } from "@/helpers/wallet-processor"
import { SaharaDailyTasks } from "@/sahara"

const galxeGobiBearDaily = async (client: GlobalClient) => {
  try {
    await client.galxe.handleVisitPageTask({ taskId: "507361624877694976", campaignId: "GCNLYtpFM5" })
    await sleep(getRandomNumber(2, 5, true))
    await client.galxe.handleVisitPageTask({ taskId: "505649247018811392", campaignId: "GCNLYtpFM5" })

    await sleep(getRandomNumber(2, 5, true))

    await client.galxe.claimTask("505649247018811392")
    await sleep(getRandomNumber(2, 5, true))
    await client.galxe.claimTask("507361624877694976")
  } catch (e) {
    console.log(e)
  }
}

const handleGalxeGobiBearDaily = async () => {
  const wallets = shuffleArray(await getWallets())
  const tasks = await processWallets(wallets, galxeGobiBearDaily)
  await runWithConcurrency(tasks, THREADS)
}

const gobiBearDaily = async (client: GlobalClient) => {
  await client.sahara.claimTask(SaharaDailyTasks.VisitXTask)
  await sleep(getRandomNumber(2, 5, true))
  await client.sahara.claimTask(SaharaDailyTasks.VisitBlogTask)
}

const handleGobiBearDaily = async () => {
  const wallets = shuffleArray(await getWallets())
  const tasks = await processWallets(wallets, gobiBearDaily)
  await runWithConcurrency(tasks, THREADS)
}

export { galxeGobiBearDaily, gobiBearDaily, handleGalxeGobiBearDaily, handleGobiBearDaily }
