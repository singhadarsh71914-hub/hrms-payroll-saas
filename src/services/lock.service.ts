// @ts-nocheck
import Redis from 'ioredis';
import Redlock from 'redlock';

const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';
const redis = isRedisEnabled ? new Redis(process.env.REDIS_URL || 'redis://localhost:6379') : null;

export const redlock = isRedisEnabled ? new Redlock([redis as any], {
  driftFactor: 0.01,
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
}) : {
  acquire: async () => ({ release: async () => {} })
} as unknown as Redlock;

export const getPayrollLockKey = (companyId: string, month: number, year: number) => {
  return `payroll:company:${companyId}:${year}:${month}`;
};
