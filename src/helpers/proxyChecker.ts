import axios, { AxiosError } from "axios"
import { HttpsProxyAgent } from "https-proxy-agent"
import { SocksProxyAgent } from "socks-proxy-agent"

import { logger } from "@/helpers"

type ProxyCheckResult = {
  proxy: string
  isWorking: boolean
  responseTime: number | null
  ip?: string
  error?: string
}

const checkProxy = async (proxy: string): Promise<ProxyCheckResult> => {
  const startTime = Date.now()

  try {
    const proxyUrl = new URL(proxy)
    const agent = proxyUrl.protocol.startsWith("socks")
      ? new SocksProxyAgent(proxy)
      : new HttpsProxyAgent(proxy)

    const response = await axios.get("http://ip-api.com/json", {
      httpsAgent: agent,
      httpAgent: agent,
      validateStatus: (status) => status === 200,
    })

    const responseTime = Date.now() - startTime

    if (response.data && response.data.query) {
      return {
        proxy,
        isWorking: true,
        responseTime,
        ip: response.data.query,
      }
    }

    throw new Error("Invalid response format")
  } catch (error) {
    const axiosError = error as AxiosError
    return {
      proxy,
      isWorking: false,
      responseTime: null,
      error: axiosError.message || "Unknown error",
    }
  }
}

const checkAllProxies = async (proxyList: string[]) => {
  const results: ProxyCheckResult[] = []
  const batchSize = 5

  for (let i = 0; i < proxyList.length; i += batchSize) {
    const batch = proxyList.slice(i, i + batchSize)
    const batchPromises = batch.map(proxy => {
      logger.info(`Checking proxy: ${proxy}`)
      return checkProxy(proxy)
    })

    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach(result => {
      if (result.isWorking) {
        logger.success(`Proxy working: ${result.proxy} (${result.responseTime}ms) - IP: ${result.ip}`)
      } else {
        logger.error(`Proxy failed: ${result.proxy} - ${result.error}`)
      }
      results.push(result)
    })

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const workingProxies = results.filter(r => r.isWorking)
  logger.info(`\nWorking proxies: ${workingProxies.length}/${proxyList.length}`)
  const sortedWorkingProxies = workingProxies
    .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))

  logger.info("\nBest working proxies (sorted by speed):")
  sortedWorkingProxies.forEach(proxy => {
    logger.info(`${proxy.proxy} - ${proxy.responseTime}ms - IP: ${proxy.ip}`)
  })

  return results
}

export { checkAllProxies, checkProxy }
