import { Client } from "@/eth-async"
import { getProxyConfigAxios } from "@/eth-async/utils"
import { Galxe } from "@/galxe"
import { Sahara } from "@/sahara"

type GlobalClientConfig ={
  name: string
  evmClient: Client
  ref?: string | null
  proxy?: string | null
  discordToken?: string | null
  twitterAuthToken?: string | null
}

class GlobalClient {
  name: string
  evmClient: Client
  galxe: Galxe
  sahara: Sahara
  ref: string | null
  proxy: string | null
  discordToken: string | null
  twitterAuthToken: string | null

  constructor(config: GlobalClientConfig) {
    this.name = config.name
    this.evmClient = config.evmClient
    this.ref = config.ref ?? null
    this.proxy = config.proxy ?? null
    this.discordToken = config.discordToken ?? null
    this.twitterAuthToken = config.twitterAuthToken ?? null
    this.galxe = new Galxe({
      name: this.name,
      evmClient: this.evmClient,
      proxy: this.proxy ? getProxyConfigAxios(this.proxy) : null,
      discordToken: this.discordToken,
      twitterAuthToken: this.twitterAuthToken,
    })
    this.sahara = new Sahara({
      name: this.name,
      evmClient: this.evmClient,
      proxy: this.proxy ? getProxyConfigAxios(this.proxy) : null,
      ref: this.ref,
    })
  }
}

export { GlobalClient, GlobalClientConfig }
