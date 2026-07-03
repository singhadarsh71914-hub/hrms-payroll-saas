import React, { useState, useEffect } from 'react';

interface PayrollProgressModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
}

export function PayrollProgressModal({ jobId, isOpen, onClose, onCancel }: PayrollProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ processed: 0, total: 0, failed: 0, eta: 0 });
  const [status, setStatus] = useState<'processing' | 'completed' | 'error' | 'cancelled'>('processing');

  useEffect(() => {
    if (!isOpen || !jobId) return;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PAYROLL_PROGRESS' && data.jobId === jobId) {
            setProgress(data.percentage);
            setStats({
              processed: data.stats.processedEmployees,
              total: data.stats.totalEmployees,
              failed: data.stats.failedEmployees,
              eta: data.stats.etaSeconds
            });
            if (data.percentage === 100) setStatus('completed');
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onerror = () => setStatus('error');
      
      ws.onclose = () => {
        if (status === 'processing') {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [isOpen, jobId, status]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setStatus('cancelled');
    onCancel();
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Almost done';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {status === 'processing' && 'Processing Payroll'}
            {status === 'completed' && 'Payroll Completed'}
            {status === 'error' && 'Connection Error'}
            {status === 'cancelled' && 'Job Cancelled'}
          </h2>
          {status !== 'processing' && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>

        <div className="mb-4">
          <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-700">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-slate-300 font-medium">
            <span>{stats.processed} / {stats.total} employees</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-400 mb-6 bg-slate-800/50 p-4 rounded-xl">
          <div className="flex justify-between">
            <span>Failures:</span>
            <span className={stats.failed > 0 ? 'text-red-400 font-bold' : ''}>{stats.failed}</span>
          </div>
          {status === 'processing' && (
            <div className="flex justify-between">
              <span>ETA:</span>
              <span>{formatEta(stats.eta)}</span>
            </div>
          )}
        </div>

        {status === 'processing' ? (
          <button 
            onClick={handleCancel}
            className="w-full py-2.5 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-colors"
          >
            Cancel Job
          </button>
        ) : (
          <button 
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
