import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Download, Play, Clock } from 'lucide-react';

export default function Reports() {
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('PAYROLL');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [emails, setEmails] = useState('');
  const [format, setFormat] = useState('csv');

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    try {
      const res = await api.get('/reports/scheduled');
      setScheduledReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNow = async () => {
    try {
      let endpoint = '/reports/payroll';
      if (reportType === 'DEPARTMENT') endpoint = '/reports/department';
      if (reportType === 'EXECUTIVE') endpoint = '/reports/executive';
      
      const recipients = emails.split(',').map(e => e.trim()).filter(Boolean);
      await api.post(endpoint, { format, recipients });
      alert('Report generation queued!');
    } catch (err) {
      alert('Failed to queue report');
    }
  };

  const handleSchedule = async () => {
    try {
      const recipients = emails.split(',').map(e => e.trim()).filter(Boolean);
      await api.post('/reports/scheduled', {
        report_type: reportType,
        frequency,
        recipients
      });
      alert('Report scheduled!');
      fetchScheduled();
    } catch (err) {
      alert('Failed to schedule report');
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Enterprise Reporting Engine</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Play size={20} /> Generate & Schedule
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 transition-colors">
                <option value="PAYROLL">Payroll Report</option>
                <option value="DEPARTMENT">Department Costs</option>
                <option value="EXECUTIVE">Executive Summary</option>
                <option value="COMPLIANCE">Compliance Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 transition-colors">
                <option value="csv">CSV (Data Export)</option>
                <option value="pdf">PDF (Printable)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Recipients (Email comma separated)</label>
              <input type="text" value={emails} onChange={e => setEmails(e.target.value)} placeholder="ceo@company.com, hr@company.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div className="pt-4 flex gap-4">
              <button onClick={handleGenerateNow} className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-medium transition-colors">
                Generate Now
              </button>
            </div>

            <div className="border-t border-slate-800 mt-6 pt-6">
              <h3 className="text-lg font-medium mb-4">Automation</h3>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Frequency</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 transition-colors">
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <button onClick={handleSchedule} className="w-full mt-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-xl font-medium transition-colors">
                Schedule Automated Delivery
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Clock size={20} /> Scheduled Automation
          </h2>
          {loading ? (
            <div className="text-slate-500">Loading schedules...</div>
          ) : scheduledReports.length === 0 ? (
            <div className="text-slate-500 h-full flex items-center justify-center">No automated reports configured</div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map(schedule => (
                <div key={schedule.id} className="bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                  <div>
                    <h4 className="font-semibold">{schedule.report_type}</h4>
                    <p className="text-sm text-slate-400">Repeats: {schedule.frequency}</p>
                    <p className="text-xs text-slate-500 mt-1">To: {(schedule.recipients as string[] || []).join(', ')}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${schedule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {schedule.enabled ? 'ACTIVE' : 'PAUSED'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
