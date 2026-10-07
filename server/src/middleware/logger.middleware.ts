import pinoHttp from 'pino-http';

import { logger } from '../lib/logger.js';

export const httpLogger = pinoHttp.pinoHttp({
  logger,
})