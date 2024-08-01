import pino from 'pino';
import pinoPretty from 'pino-pretty';
import dayjs from './dayjs';

const logger = pino(
  {
    base: {
      pid: true,
    },
    timestamp: () => `,"time":"${dayjs().format()}"`,
  },
  pinoPretty(),
);

export default logger;
