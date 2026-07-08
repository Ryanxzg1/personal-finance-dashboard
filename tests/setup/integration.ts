import { beforeAll } from 'vitest';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

beforeAll(() => {
  const dbUrl = process.env.DATABASE_URL;
  const testDbUrl = process.env.TEST_DATABASE_URL;
  
  if (!testDbUrl) {
    throw new Error('TEST_DATABASE_URL is not defined in environment variables.');
  }

  if (dbUrl === testDbUrl) {
    throw new Error('TEST_DATABASE_URL MUST NOT be the same as DATABASE_URL to prevent accidental data loss in production/development databases.');
  }

  if (process.env.ALLOW_TEST_DATABASE_RESET !== 'true') {
    throw new Error('ALLOW_TEST_DATABASE_RESET must be explicitly set to "true" to run integration tests.');
  }
});
