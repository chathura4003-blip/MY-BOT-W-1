'use strict';

class QueueService {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  async next() {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running += 1;
    try {
      const result = await item.task();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.running -= 1;
      this.next();
    }
  }
}

module.exports = { QueueService };
