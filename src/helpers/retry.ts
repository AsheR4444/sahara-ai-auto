import { RETRIES_AMOUNT } from "@/config"
import { getRandomNumber, logger,sleep } from "@/helpers"

const retry = (actionName: string, silenceErrors: boolean = false) => {
  return function(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const walletName = (this as any).name

      for (let attempt = 1; attempt <= RETRIES_AMOUNT; attempt++) {
        try {
          const result = await originalMethod.apply(this, args)
          if (result !== false) {
            if (attempt > 1) {
              if (!silenceErrors) {
                logger.success(
                  `${walletName} | ${actionName} succeeded on attempt ${attempt}`,
                )
              }
            }
            return result
          }
        } catch (error) {
          if (!silenceErrors) {
            logger.error(
              `${walletName} | ${actionName} attempt ${attempt} failed: ${error}`,
            )
          }
        }

        if (attempt < RETRIES_AMOUNT) {
          if (!silenceErrors) {
            logger.info(
              `${walletName} | Retrying ${actionName} (attempt ${attempt + 1}/${
                RETRIES_AMOUNT
              })`,
            )
          }
          await sleep(getRandomNumber(3, 5, true))
        }
      }

      logger.error(
        `${walletName} | ${actionName} failed after ${RETRIES_AMOUNT} attempts`,
      )
      return false
    }

    return descriptor
  }
}

export { retry }
