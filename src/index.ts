import { Job } from 'bullmq';
import logger from './utils/logger';
import JobManager from './job-manager';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const jobManager = new JobManager({
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string, 10),
  });
  await jobManager.startDashboard();

  const worker = jobManager.createWorker('test', 1, async (job) => {
    logger.info(`Job ${job.id} has started`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info(`Job ${job.id} has completed`);
    return 'test';
  });

  worker.on('completed', (job: Job) => {
    logger.info(`Job ${job.id} in queue ${job.queueName} has completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.info(`Job ${job?.id} in queue ${job?.queueName} has failed with error ${err.message}`);
  });

  await jobManager.addJob('test', 'test', { test: 'test' }, { removeOnComplete: true, removeOnFail: true });

  logger.info('Jobs added');
}

process.on('uncaughtException', (error: unknown) => {
  if (error instanceof Error) {
    logger.error(error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (error: unknown) => {
  if (error instanceof Error) {
    logger.error(error);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM');
  process.exit(0);
});

main();
