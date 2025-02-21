const runWithConcurrency = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> => {
  const results: T[] = []
  const running = new Set<Promise<void>>()

  for (const task of tasks) {
    const promise = (async () => {
      const result = await task()
      results.push(result)
    })()

    running.add(promise)
    promise.then(() => running.delete(promise))

    if (running.size >= concurrency) {
      await Promise.race(running)
    }
  }

  // Wait for any remaining tasks to complete
  if (running.size > 0) {
    await Promise.all(running)
  }

  return results
}

export { runWithConcurrency }
