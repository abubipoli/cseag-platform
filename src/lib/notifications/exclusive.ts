// Runs async tasks strictly one at a time, in the order they were requested.
// Used so "check the hourly count, then send" can't be raced by a broadcast
// that starts hundreds of sends concurrently (each would otherwise read the
// same stale count and all slip under the cap).
export function createExclusive() {
  let tail: Promise<unknown> = Promise.resolve();
  return function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}
