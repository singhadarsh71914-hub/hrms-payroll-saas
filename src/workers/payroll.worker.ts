import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import prisma from '../lib/prisma.ts';
import { WebSocketService } from '../services/websocket.service.ts';
import { moveToDLQ } from '../services/queue.service.ts';
import { MetricsService } from '../services/metrics.service.ts';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const payrollWorker = new Worker('payroll-processing', async (job: Job) => {
  const { payroll_job_id, company_id, month, year, employee_ids } = job.data;
  
  MetricsService.incrementPayrollJobsRunning();
  const startTime = Date.now();

  try {
    let processed = 0;
    let failed = 0;
    const total = employee_ids.length;

    for (let i = 0; i < total; i++) {
      const empId = employee_ids[i];
      try {
        // Mocking heavy computation or db calls for benchmarking
        await new Promise(r => setTimeout(r, 1)); 
        processed++;
      } catch (err) {
        failed++;
      }

      // Progress reporting every 25 employees
      if ((i + 1) % 25 === 0 || i === total - 1) {
        const percentage = Math.round(((i + 1) / total) * 100);
        // Emulate simple ETA: (time taken so far / processed) * remaining
        const elapsed = Date.now() - startTime;
        const etaSeconds = Math.round(((elapsed / (i + 1)) * (total - (i + 1))) / 1000);
        
        await job.updateProgress(percentage);
        WebSocketService.broadcastProgress(job.id as string, percentage, {
          jobId: job.id,
          processedEmployees: processed,
          totalEmployees: total,
          failedEmployees: failed,
          percentage,
          etaSeconds
        });
      }
    }

    MetricsService.observePayrollDuration(Date.now() - startTime);
    MetricsService.incrementPayrollJobsCompleted();
    
    // Update DB
    await prisma.payrollJob.update({
      where: { id: payroll_job_id },
      data: {
        status: 'COMPLETED',
        processed_employees: processed,
        failed_employees: failed,
        completed_at: new Date()
      }
    });

  } catch (error: any) {
    MetricsService.incrementPayrollJobsFailed();
    MetricsService.incrementWorkerFailures();
    
    // Update DB to reflect error if possible
    await prisma.payrollJob.update({
      where: { id: payroll_job_id },
      data: { status: 'FAILED' }
    });
    throw error;
  } finally {
    MetricsService.decrementPayrollJobsRunning();
  }
}, { connection: connection as any });

payrollWorker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await moveToDLQ('payroll-processing', job.data, err);
  }
});
