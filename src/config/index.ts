import chalk from "chalk"
import fs from "fs"
import { load } from "js-yaml"
import path from "path"

const ROOT_DIR = path.resolve()
const SRC_DIR = path.join(ROOT_DIR, "src")
const DB_PATH = path.join(SRC_DIR, "files", "data.db")
const USER_DATA_PATH = path.join(SRC_DIR, "files")
const CSV_DATA_PATH = path.join(USER_DATA_PATH, "wallets.csv")
const CONFIG_PATH = path.join(SRC_DIR, "files", "config.yaml")

interface Config {
  captcha: {
    bestsolver: string | number
    rucaptcha: string | number
  }
  ref_codes: string[]
  retries?: number
}

const createDefaultConfig = () => {
  const configContent = `captcha:
  bestsolver: ""
  rucaptcha: ""

ref_codes: [
  ""
]

retries: 5
`

  const configDir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  fs.writeFileSync(CONFIG_PATH, configContent, "utf8")
  return load(configContent) as Config
}

const getConfig = (): Config => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.log(chalk.yellow("Config file not found, creating default config..."))
      return createDefaultConfig()
    }
    const fileContents = fs.readFileSync(CONFIG_PATH, "utf8")
    return load(fileContents) as Config
  } catch (error) {
    console.error("Error reading config:", error)
    process.exit(1)
  }
}

const CONFIG = getConfig()

const CAPTCHA_BESTSOLVER_KEY = String(CONFIG.captcha.bestsolver)
const CAPTCHA_RUCAPTCHA_KEY = String(CONFIG.captcha.rucaptcha)
const REF_CODES = CONFIG.ref_codes
const RETRIES_AMOUNT = CONFIG.retries || 5

const checkCaptchaKeys = (): boolean => {
  if (!CAPTCHA_BESTSOLVER_KEY || CAPTCHA_BESTSOLVER_KEY === "your bestsolver key") {
    console.log(chalk.red("Error: CAPTCHA_BESTSOLVER_KEY is not set in config.yaml"))
    return false
  }

  if (!CAPTCHA_RUCAPTCHA_KEY || CAPTCHA_RUCAPTCHA_KEY === "your rucaptcha key") {
    console.log(chalk.red("Error: CAPTCHA_RUCAPTCHA_KEY is not set in config.yaml"))
    return false
  }

  return true
}

export {
  CAPTCHA_BESTSOLVER_KEY,
  CAPTCHA_RUCAPTCHA_KEY,
  checkCaptchaKeys,
  CSV_DATA_PATH,
  DB_PATH,
  REF_CODES,
  RETRIES_AMOUNT,
  SRC_DIR,
}
