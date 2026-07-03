import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export const WebSocketService = {
  init(server: any) {
    wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      console.log('Client connected for progress tracking');
    });
  },
  broadcastProgress(jobId: string, progress: number, stats: any) {
    if (!wss) return;
    const payload = JSON.stringify({ type: 'PAYROLL_PROGRESS', jobId, progress, stats });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload);
    });
  }
};
