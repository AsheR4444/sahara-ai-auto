import { existsSync, writeFileSync } from "fs"
import { join } from "path"

import { CSV_DATA_PATH } from "@/config"

const alp = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export const randomString = (length: number, charset: string = alp): string => {
  let result = ""
  const n = charset.length
  const h = 256 - (256 % n)

  while (length > 0) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil((256 * length) / h)))
    let i = 0

    while (i < bytes.length && length > 0) {
      const r = bytes[i]
      if (r < h) {
        result += charset[r % n]
        length--
      }
      i++
    }
  }

  return result
}

export const randomStringForEntropy = (entropy: number, charset: string = alp): string => {
  return randomString(Math.ceil(entropy / (Math.log(charset.length) / Math.log(2))), charset)
}

export const writeJsonToFile = (data: unknown, filename: string) => {
  try {
    const filePath = join(process.cwd(), filename)
    writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.log(`Data written to ${filePath}`)
  } catch (error) {
    console.error(`Error writing to file: ${error}`)
  }
}

export const sleep = (sec: number) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000))
}

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const createCsvTemplate = () => {
  if (existsSync(CSV_DATA_PATH)) {
    /* console.log("----------")
    console.log()
    console.log(chalk.yellow(`CSV template already exists at: ${CSV_DATA_PATH}`))
    console.log()
    console.log("----------") */
    return
  }

  const headers = ["name", "private key", "proxy"]
  const csvContent = headers.join(",") + "\n"

  writeFileSync(CSV_DATA_PATH, csvContent, "utf-8")

  // console.log("----------")
  // console.log()
  // console.log(chalk.green(`CSV template created at: ${CSV_DATA_PATH}`))
  // console.log()
  // console.log("----------")
}

export const getQueryParam = (url: string, name: string): string | null => {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get(name)
  } catch {
    return null
  }
}
