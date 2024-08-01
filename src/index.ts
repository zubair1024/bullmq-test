import configuration from './utils/configuration';
import logger from './utils/logger';

function main() {
  logger.info(`App running in ${configuration.env} env!`);
  logger.info(`App has the following the following configuration ${JSON.stringify(configuration)}`);
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
