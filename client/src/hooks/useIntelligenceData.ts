import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getToken } from '../utils/auth';
import { io } from 'socket.io-client';

export function useIntelligenceData() {
  const [data, setData] = useState<any>({
    activeWorkers: 0,
    avgTrustScore: 0,
    remoteWorkers: 0,
    criticalRisks: 0,
    lowTrustFlags: [],
    recentEvents: [],
    analytics: null,
    forecast: null,
    sparklines: null,
    liveWorkforce: { employees: [], locations: [] },
    companyLocation: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const safeDate = (value: any) => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [intelRes, liveRes, compRes] = await Promise.all([
        api.get('/attendance/intelligence'),
        api.get('/attendance/live'),
        api.get('/company/location').catch(() => ({ data: null }))
      ]);
      
      setData((prev: any) => ({
        ...prev,
        activeWorkers: intelRes.data.activeWorkers || 0,
        avgTrustScore: intelRes.data.avgTrustScore || intelRes.data.analytics?.stats?.avgTrust || 0,
        remoteWorkers: intelRes.data.remoteWorkers || 0,
        criticalRisks: intelRes.data.criticalRisks || 0,
        lowTrustFlags: intelRes.data.lowTrustFlags || [],
        recentEvents: (intelRes.data.recentEvents || []).map((e: any) => ({ 
          ...e, 
          time: safeDate(e.time) || new Date()
        })),
        analytics: intelRes.data.analytics || prev.analytics,
        forecast: intelRes.data.forecast || prev.forecast,
        sparklines: intelRes.data.sparklines || prev.sparklines,
        trendMetrics: intelRes.data.trendMetrics || prev.trendMetrics || { activeWorkersDelta: 0, trustDelta: 0, remoteDelta: 0, riskDelta: 0 },
        liveWorkforce: liveRes.data || { employees: [], locations: [] },
        companyLocation: compRes.data
      }));
    } catch (err) {
      console.error('Failed to fetch intelligence data', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const token = getToken();
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:3000';
    const newSocket = io(socketUrl || window.location.origin, {
      auth: { token }
    });

    newSocket.on('connect', () => console.log('Intelligence Socket connected'));
    newSocket.on('EMPLOYEE_CHECKED_IN', () => fetchData());
    newSocket.on('EMPLOYEE_CHECKED_OUT', () => fetchData());
    newSocket.on('LOW_TRUST_SCORE', () => fetchData());
    
    newSocket.on('notification:new', (eventData: any) => {
       if (eventData.type === 'REFRESH_REQUIRED') {
         fetchData();
       }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

