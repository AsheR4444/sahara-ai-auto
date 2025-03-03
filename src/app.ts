import chalk from "chalk"
import prompts from "prompts"

import { checkCaptchaKeys } from "@/config"
import { createDatabase } from "@/db"
import { createCsvTemplate, importWallets, logAuthor } from "@/helpers"
import { handleGalxeGobiBearDaily, handleGobiBearDaily, saharaGetBalances, saharaOnchainClaim, saharaOnchainTransactionSend  } from "@/tasks"

import "dotenv/config"

export const THREADS = 10

enum ActionEnum {
  IMPORT_CSV = "importCsv",
  //HANDLE_FAUCET = "handleFaucet",
  HANDLE_ONCHAIN_TRANSACTION = "handleOnchainTransaction",
  GET_BALANCES = "getBalances",
  GALXE_GOBI_BEAR_DAILY = "galxeGobiBearDaily",
  GOBI_BEAR_DAILY = "gobiBearDaily",
  CLAIM_TASK_ONCHAIN = "claimTaskOnchain",
}

type Choice = {
  title: string;
  value: ActionEnum;
  description: string;
}

const isRequiresCaptcha = (action: ActionEnum): boolean => {
  return [
    //ActionEnum.HANDLE_FAUCET,
    ActionEnum.HANDLE_ONCHAIN_TRANSACTION,
  ].includes(action)
}

const handleAction = async (action: ActionEnum): Promise<void> => {
  if (isRequiresCaptcha(action) && !checkCaptchaKeys()) {
    console.log(chalk.yellow("Please set your CAPTCHA keys in config.yaml and try again"))
    return
  }

  switch (action) {
  case ActionEnum.IMPORT_CSV:
    await importWallets()
    return
    //case ActionEnum.HANDLE_FAUCET:
    //  await handleFaucet()
    return
  case ActionEnum.HANDLE_ONCHAIN_TRANSACTION:
    await saharaOnchainTransactionSend()
    return
  case ActionEnum.GET_BALANCES:
    await saharaGetBalances()
    return
  case ActionEnum.GALXE_GOBI_BEAR_DAILY:
    await handleGalxeGobiBearDaily()
    return
  case ActionEnum.GOBI_BEAR_DAILY:
    await handleGobiBearDaily()
    return
  case ActionEnum.CLAIM_TASK_ONCHAIN:
    await saharaOnchainClaim()
    return
  }
}

const main = async () => {
  logAuthor()
  createCsvTemplate()
  await createDatabase()

  const response = await prompts({
    type: "select",
    name: "action",
    message: "Choose option",
    choices: [
      { title: "Import data from CSV", value: ActionEnum.IMPORT_CSV, description: "Import your wallets from CSV to DB" },
      { title: "Get info", value: ActionEnum.GET_BALANCES, description: "Get wallets balances, tx amount, shards amount" },
      { title: "Handle Galxe Gobi Bear Daily", value: ActionEnum.GALXE_GOBI_BEAR_DAILY, description: "Galxe Gobi Bear daily tasks" },
      { title: "Handle Gobi Bear Daily", value: ActionEnum.GOBI_BEAR_DAILY, description: "Gobi Bear daily tasks on Sahara website" },
      //{ title: "Handle Faucet", value: ActionEnum.HANDLE_FAUCET, description: "Get tokens from faucet" },
      { title: "Handle Onchain Transaction + claim task on website", value: ActionEnum.HANDLE_ONCHAIN_TRANSACTION, description: "Send tokens to wallets" },
      { title: "Handle only claim task onchain without generating tx", value: ActionEnum.CLAIM_TASK_ONCHAIN },
    ] as Choice[],
  }) as prompts.Answers<"action"> & { action: ActionEnum }

  await handleAction(response.action)
}

main()
