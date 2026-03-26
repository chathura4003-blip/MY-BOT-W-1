'use strict';

class InMemoryQueue {
  constructor({ concurrency = 1 } = {}) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  process() {
    while (this.running < this.concurrency && this.queue.length) {
      const worker = this.queue.shift();
      this.running += 1;
      worker().finally(() => {
        this.running -= 1;
        this.process();
      });
    }
  }

  getStatus() {
    return { pending: this.queue.length, running: this.running, concurrency: this.concurrency };
  }
}

module.exports = { InMemoryQueue };
