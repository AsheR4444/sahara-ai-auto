import axios, { AxiosError, AxiosProxyConfig, AxiosRequestConfig } from "axios"
import UserAgent from "user-agents"
import uuid4 from "uuid4"

import { Client , TokenAmount } from "@/eth-async"
import { logger, sleep } from "@/helpers"

import { solveHCaptcha } from "./captcha"
import { SaharaDailyTasks, SaharaSocialTasks, SaharaTask } from "./tasks"
import { ChallengeResponseTypes, ClaimTaskResponseTypes, ConfigTableResponseTypes, DataBatchResponseTypes, GetTokensFromFaucetErrorResponseTypes, GetTokensFromFaucetSuccessResponseTypes, SignInResponseTypes } from "./types"

type SaharaConfig = {
  name: string
  evmClient: Client
  proxy: AxiosProxyConfig | null
  ref: string | null
}

class Sahara {
  name: string
  evmClient: Client
  userAgent: string
  headers: Required<AxiosRequestConfig>["headers"]
  token: string | null
  proxy: AxiosProxyConfig | null
  ref: string | null

  private readonly API_URL = "https://legends.saharalabs.ai/api/v1"
  private readonly API_URL_CHALLENGE = this.API_URL + "/user/challenge"
  private readonly API_URL_SIGNIN = this.API_URL + "/login/wallet"
  private readonly API_URL_FLUSH_TASK = this.API_URL + "/task/flush"
  private readonly API_URL_FLUSH_ALL_TASK = this.API_URL + "/task/flushAll"
  private readonly API_URL_CLAIM_TASK = this.API_URL + "/task/claim"
  private readonly API_URL_BATCH_TASK = this.API_URL + "/task/dataBatch"
  private readonly API_URL_FAUCET_CLAIM = "https://faucet-api.saharaa.info/api/claim"
  private readonly API_URL_CONFIG_TABLE = `${this.API_URL}/system/configTable`
  private readonly API_URL_GET_INFO = `${this.API_URL}/user/info`

  constructor({ name, evmClient, proxy, ref }: SaharaConfig) {
    const userAgent = new UserAgent({
      deviceCategory: "desktop",
    }).toString()
    this.proxy = proxy

    this.name = name
    this.evmClient = evmClient
    this.userAgent = userAgent
    this.token = null
    this.ref = ref
    this.headers = {
      "accept-language": "en-US,en;q=0.5",
      "authorization": "Bearer null",
      "origin": "https://legends.saharalabs.ai",
      "priority": "u=1, i",
      "referer": "https://legends.saharalabs.ai/",
      "user-agent": this.userAgent,
    }
  }

  private setAuthToken(token: string) {
    this.token = token

    this.headers = {
      ...this.headers,
      "authorization": `Bearer ${this.token}`,
    }
  }

  private async request<T>(url: string, data?: unknown) {
    const response = await axios.post<T>(
      url,
      data,
      {
        headers: this.headers,
      },
    )
    return response.data
  }

  private async getChallenge() {
    try {
      const response = await this.request<ChallengeResponseTypes>(this.API_URL_CHALLENGE, {
        address: this.evmClient.signer.address.toLowerCase(),
      })

      return response.challenge
    } catch (e) {
      console.log(e)

      return false
    }
  }

  private async flushTask(taskID: string) {
    try {
      await this.request<void>(this.API_URL_FLUSH_TASK, {
        taskID,
      })

    } catch (error) {
      logger.error(error)
    }

    await sleep(1)

    try {
      const batchResponse = await this.request<DataBatchResponseTypes>(this.API_URL_BATCH_TASK, {
        taskIDs: [taskID],
      })

      return batchResponse[taskID].status

    } catch (error) {
      logger.error(error)

      return false
    }
  }

  private async getConfigTable() {
    if (!this.token) {
      await this.signIn()
    }

    try {
      const response = await this.request<ConfigTableResponseTypes>(this.API_URL_CONFIG_TABLE)

      return response
    } catch (e) {
      console.log(e)

      return false
    }
  }

  async getTasks() {
    if (!this.token) {
      await this.signIn()
    }

    const configTable = await this.getConfigTable()

    if (!configTable) return false

    const tasks = configTable.taskMap

    return tasks
  }

  async signIn() {
    const challenge = await this.getChallenge()

    if (!challenge) return false
    const message = `Sign in to Sahara!\nChallenge:${challenge}`

    try {
      const signature = await this.evmClient.signer.signMessage(message)

      const resp = await this.request<SignInResponseTypes>(this.API_URL_SIGNIN, {
        address: this.evmClient.signer.address.toLowerCase(),
        sig: signature,
        referralCode: this.ref,
        walletUUID: uuid4(),
        walletName: "Rabby Wallet",
      })

      this.setAuthToken(resp.accessToken)

      //logger.success(`Account ${this.client.name} | Signed in to Sahara`)

      return true
    } catch (error) {
      return false
    }
  }

  async claimTask(task: SaharaTask) {
    if (!this.token) {
      await this.signIn()
    }

    logger.info(`Account ${this.name} | Start claiming task ${task.name}`)

    await this.flushTask(task.taskID)
    const taskStatus = await this.flushTask(task.taskID)

    if (taskStatus === "1") {
      logger.error(`Account ${this.name} | Task ${task.name} is not ready for claim`)

      return false
    }

    if (taskStatus === "3") {
      logger.success(`Account ${this.name} | Task ${task.name} is already claimed`)

      return true
    }

    try {
      const response = await this.request<ClaimTaskResponseTypes>(this.API_URL_CLAIM_TASK, {
        "taskID": task.taskID,
      })

      if (response[0].amount) {
        logger.success(`Account ${this.name} | Task claimed: ${task.name}`)

        return response
      } else {
        console.log(response)

        return false
      }

    } catch (error) {

      logger.error(`Account ${this.name} | Failed to claim task ${task.name}: ${error}`)

      return false
    }
  }

  async getShardsAmount() {
    if (!this.token) {
      await this.signIn()
    }

    try {
      const response = await this.request<{
        id: string,
        address: string,
        challenge: string,
        createdAt: string,
        updatedAt: string,
        walletUUID: string,
        walletName: string,
        shardAmount: string,
        mapStates: [
            {
                id: string,
                progress: string,
                mintable: boolean,
                claimable: boolean
            },
        ],
      taskStateMap: null
    }>(this.API_URL_GET_INFO)

      return response.shardAmount
    } catch (error) {
      logger.error(`Account ${this.name} | Error while getting shards amount ${error}`)

      return false
    }
  }

  async sendTokens(amount: string | number) {

    logger.info(`Account ${this.name} | Start sending tokens`)
    try {
      const txParams = {
        to: this.evmClient.signer.address,
        value: new TokenAmount(amount, 18).Wei,
      }

      const txResponse = await this.evmClient.transactions.sendTransaction(txParams)
      await sleep(3)
      const receipt = await this.evmClient.transactions.waitTransaction(txResponse)

      if (receipt && receipt.status === 1) {
        logger.success(`Account ${this.name} | Transaction successful! ${this.evmClient.network.explorer}tx/${receipt.hash}`)
        return true
      } else {
        logger.error(`Account ${this.name} | Error while sending tokens. Tx failed ${receipt?.hash}`)
        return false
      }
    } catch (error) {
      logger.error(`Account ${this.name} | Error while sending tokens ${error}`)
      return false
    }
  }

  async getTokensFromFaucet() {
    logger.info(`Account ${this.name} | Start getting tokens from faucet`)

    const captchaResponse = await solveHCaptcha(
      {
        accountName: this.name,
        ua: this.userAgent,
        proxy: this.proxy,
      },
    )

    try {
      const response = await axios.post<GetTokensFromFaucetSuccessResponseTypes>(
        this.API_URL_FAUCET_CLAIM,
        {
          address: this.evmClient.signer.address,
        },
        {
          headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.8",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "h-captcha-response": captchaResponse.data,
            "origin": "https://faucet.saharalabs.ai",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "referer": "https://faucet.saharalabs.ai/",
            "user-agent": this.userAgent,
          },
          proxy: this.proxy || false,
        },
      )

      logger.success(`Account ${this.name} | Claimed tokens from faucet: ${response.data.msg}`)
    } catch (error) {
      const typedError = error as AxiosError<GetTokensFromFaucetErrorResponseTypes>
      logger.error(`Account ${this.name} | Error while getting tokens from faucet ${error}`)
    }

  }

  private async flushAllTasks() {
    if (!this.token) {
      await this.signIn()
    }

    await this.request<void>(this.API_URL_FLUSH_ALL_TASK)
  }

  async getUnclaimedSortedTasks(taskIds: string[]) {
    if (!this.token) {
      await this.signIn()
    }

    await this.flushAllTasks()
    const tasks = await this.getTasks()

    if (!tasks) return false

    const taskArray = Object.values(tasks).map(task => task.id)

    const response = await this.request<DataBatchResponseTypes>(this.API_URL_BATCH_TASK, {
      taskIDs: taskArray,
    })

    const unclaimedTasks = Object.entries(response)
      .filter(([key]) => taskIds.includes(key))
      .filter(([key, value]) => value.status === "2")
      .map(([key]) => key)

    return unclaimedTasks
  }

  async getUnlaimedDailyTasks() {
    if (!this.token) {
      await this.signIn()
    }

    const unclaimedTasks = await this.getUnclaimedSortedTasks(SaharaDailyTasks.getAllTaskIds())

    if (!unclaimedTasks) {
      logger.info(`Account ${this.name} | Not found any unclaimed daily tasks`)

      return []
    }

    logger.info(`Account ${this.name} | Found ${unclaimedTasks.length} unclaimed daily tasks`)

    return unclaimedTasks
  }

  async getUnlaimedSocialTasks() {
    if (!this.token) {
      await this.signIn()
    }

    const unclaimedTasks = await this.getUnclaimedSortedTasks(SaharaSocialTasks.getAllTaskIds())

    if (!unclaimedTasks) {
      logger.info(`Account ${this.name} | Not found any unclaimed social tasks`)

      return []
    }

    logger.info(`Account ${this.name} | Found ${unclaimedTasks.length} unclaimed social tasks`)

    return unclaimedTasks
  }
}

export { Sahara }
