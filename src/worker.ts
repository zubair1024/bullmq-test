import { Job, Worker } from 'bullmq';
import { workerData } from 'worker_threads';

const connection = {
  host: 'localhost',
  port: 6379,
};

const queueName: string = workerData.queueName;

// Define the processing function for the worker
const processJob = async (job: Job) => {
  console.log(`Processing job ${job?.id} from ${queueName}:`, job.data);
  // Add your job processing logic here
};

// Create a worker for the specified queue
const worker = new Worker(queueName, processJob, { connection: connection, concurrency: 1 });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} from ${queueName} completed`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} from ${queueName} failed:`, err);
});
