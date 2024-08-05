import { Queue, Worker, QueueOptions, WorkerOptions, Job, JobsOptions } from 'bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import express from 'express';
import path from 'path';

interface ConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

class JobManager {
  private connection: ConnectionOptions;
  private queues: { [key: string]: Queue };
  private workers: { [key: string]: Worker };
  private addQueueMonitor: (queue: Queue) => void;
  private removeQueueMonitor: (queue: Queue) => void;
  private expressApp: express.Application;

  constructor(connection: ConnectionOptions) {
    this.connection = connection;
    this.queues = {};
    this.workers = {};
    const serverAdapter = new ExpressAdapter();
    const { addQueue, removeQueue } = createBullBoard({
      queues: [],
      serverAdapter: serverAdapter,
    });
    this.expressApp = express();
    serverAdapter.setBasePath('/admin/queues');
    this.expressApp.use('/admin/queues', serverAdapter.getRouter());
    this.addQueueMonitor = (queue: Queue) => addQueue(new BullMQAdapter(queue));
    this.removeQueueMonitor = (queue: Queue) => removeQueue(queue.name);
  }

  async startDashboard() {
    this.expressApp.listen(process.env.PORT ?? 3100, () => {
      console.log(`Running on ${process.env.PORT ?? 3100}...`);
      console.log(`For the UI, open http://localhost:${process.env.PORT ?? 3100}/admin/queues`);
      console.log('Make sure Redis is running on port 6379 by default');
    });
  }

  private getQueue(queueName: string): Queue {
    if (!this.queues[queueName]) {
      const queueOptions: QueueOptions = { connection: this.connection, defaultJobOptions: { removeOnComplete: true } };
      this.queues[queueName] = new Queue(queueName, queueOptions);
      this.addQueueMonitor?.(this.queues[queueName]);
    }
    return this.queues[queueName];
  }

  async addJob<T>(
    queueName: string,
    name: string,
    data: T,
    options: JobsOptions = {
      removeOnComplete: true,
      removeOnFail: true,
    },
  ): Promise<Job> {
    const queue = this.getQueue(queueName);
    return queue.add(name, data, options);
  }

  createWorker<T>(queueName: string, concurrency: number, processor: (job: Job<T>) => Promise<void>): Worker {
    const workerOptions: WorkerOptions = { connection: this.connection, concurrency: 1, autorun: true };
    const worker = new Worker(queueName, processor, workerOptions);
    if (!this.workers) this.workers = {};
    this.workers[queueName] = worker;

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} in queue ${queueName} has completed`);
    });

    worker.on('failed', (job, err) => {
      console.log(`Job ${job?.id} in queue ${queueName} has failed with error ${err.message}`);
    });

    return worker;
  }

  removeWorker(queueName: string) {
    const worker = this.workers[queueName];
    if (!worker) {
      throw new Error(`Worker for queue ${queueName} not found`);
    }
    worker.removeAllListeners();
    this.removeQueueMonitor?.(this.queues[queueName]);
    delete this.workers[queueName];
  }

  removeAllWorkers() {
    Object.values(this.workers).forEach((worker) => {
      worker.removeAllListeners();
      this.removeQueueMonitor?.(this.queues[worker.name]);
      delete this.workers[worker.name];
    });
  }

  removeQueue(queueName: string) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    this.removeQueueMonitor?.(queue);
    delete this.queues[queueName];
  }

  removeAllQueues() {
    Object.values(this.queues).forEach((queue) => {
      this.removeQueueMonitor?.(queue);
      delete this.queues[queue.name];
    });
  }

  getWorker(queueName: string): Worker {
    const worker = this.workers?.[queueName];
    if (!worker) {
      throw new Error(`Worker for queue ${queueName} not found`);
    }
    return worker;
  }

  getAllWorkers(): Worker[] {
    return Object.values(this.workers ?? []);
  }

  // TODO use this if needed
  spawnWorker(queueName: string) {
    new Worker(path.resolve(__dirname, 'worker.ts'), {
      //@ts-expect-error this will work
      workerData: {
        queueName,
      },
    });
  }
}

export default JobManager;
