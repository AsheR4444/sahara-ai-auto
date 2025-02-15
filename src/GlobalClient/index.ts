import { Client } from "@/eth-async"
import { Galxe } from "@/galxe"
import { Sahara } from "@/sahara"

class GlobalClient {
  name: string
  evmClient: Client
  galxe: Galxe
  sahara: Sahara
  ref: string | null
  proxy: string | null
  discordToken: string | null

  constructor(name: string, evmClient: Client, ref: string | null, proxy: string | null, discordToken: string | null) {
    this.name = name
    this.ref = ref
    this.evmClient = evmClient
    this.proxy = proxy
    this.discordToken = discordToken
    this.galxe = new Galxe(this)
    this.sahara = new Sahara(this)
  }
}

export { GlobalClient }
