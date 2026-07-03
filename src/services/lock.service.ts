// @ts-nocheck
import Redis from 'ioredis';
import Redlock from 'redlock';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
});

export const getPayrollLockKey = (companyId: string, month: number, year: number) => {
  return `payroll:company:${companyId}:${year}:${month}`;
};
