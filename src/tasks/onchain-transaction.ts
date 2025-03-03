import Decimal from "decimal.js"

import { THREADS } from "@/app"
import { getWallets } from "@/db"
import { GlobalClient } from "@/GlobalClient"
import { getRandomNumber, shuffleArray } from "@/helpers"
import { runWithConcurrency } from "@/helpers/executor"
import { processWallets } from "@/helpers/wallet-processor"
import { SaharaDailyTasks } from "@/sahara"

const handleFaucetTx = async (client: GlobalClient) => {
  const balance = (await client.evmClient.wallet.balance()).Ether
  const amountToSend = getRandomNumber(0.0001, 0.002)

  if (balance.greaterThan(new Decimal(amountToSend))) {
    const isTxSuccessful = await client.sahara.sendTokens(amountToSend)

    if (isTxSuccessful) {
      await client.sahara.claimTask(SaharaDailyTasks.GenerateTransactionTask)
    }
  }
}

const handleOnlyClaimForTx = async (client: GlobalClient) => {
  await client.sahara.claimTask(SaharaDailyTasks.GenerateTransactionTask)
}

const saharaOnchainClaim = async () => {
  const wallets = shuffleArray(await getWallets())
  const tasks = await processWallets(wallets, handleOnlyClaimForTx)
  await runWithConcurrency(tasks, THREADS)
}

const saharaOnchainTransactionSend = async () => {
  const wallets = shuffleArray(await getWallets())
  const tasks = await processWallets(wallets, handleFaucetTx)
  await runWithConcurrency(tasks, THREADS)
}

export { saharaOnchainClaim,saharaOnchainTransactionSend }
