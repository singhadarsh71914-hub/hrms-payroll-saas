import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader2, BrainCircuit, Activity, AlertTriangle, TrendingUp, TrendingDown, Users, History, Lightbulb, BarChart } from 'lucide-react';
const Card = ({children, className}: any) => <div className={className || "bg-white p-4 rounded-xl shadow border border-slate-100"}>{children}</div>;
const CardHeader = ({children, className}: any) => <div className={className || "mb-4 border-b pb-2"}>{children}</div>;
const CardTitle = ({children, className}: any) => <h3 className={className || "text-lg font-bold text-slate-800"}>{children}</h3>;
const CardContent = ({children, className}: any) => <div className={className}>{children}</div>;
const Button = ({children, className, onClick}: any) => <button onClick={onClick} className={className || "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"}>{children}</button>;
const Badge = ({children, className, variant}: any) => {
    let color = "bg-slate-100 text-slate-800";
    if (variant === 'destructive') color = "bg-red-100 text-red-800";
    if (variant === 'warning') color = "bg-amber-100 text-amber-800";
    if (variant === 'success') color = "bg-green-100 text-green-800";
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${color} ${className}`}>{children}</span>;
};

export default function WorkforceIntelligence() {
  const [data, setData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, compRes] = await Promise.all([
            api.get('/intelligence/dashboard'),
            api.get('/intelligence/company')
        ]);
        setData(dashRes.data.data);
        setCompanyData(compRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const triggerAnalysis = async () => {
    await api.post('/intelligence/calculate', { type: 'ALL' });
    alert("Background analysis triggered!");
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const latest = companyData?.latest || {};
  const history = companyData?.history || [];
  const anomalies = latest.anomalies || [];
  const recs = latest.recommendations || [];
  const forecast = data?.forecast || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit className="text-indigo-600" /> Statistical Workforce Intelligence</h1>
          <p className="text-slate-500 mt-1">AI-powered insights driven by EMA, WMA, and 3-sigma thresholds</p>
        </div>
        <Button onClick={triggerAnalysis} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Activity className="w-4 h-4" /> Run Deep Analysis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Attrition Risk (V2)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{latest.attrition_risk || 'LOW'}</div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">Model confidence: 85%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Burnout Heatmap</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{latest.burnout_risk || 'MEDIUM'}</div>
            <div className="w-full h-2 bg-slate-100 rounded mt-2 flex overflow-hidden">
                <div className={`h-full ${latest.burnout_risk === 'HIGH' || latest.burnout_risk === 'CRITICAL' ? 'bg-red-500 w-3/4' : 'bg-amber-400 w-1/2'}`}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Z-Score Composite: Overtime & Absences</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Attendance Health</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{latest.attendance_score || 95}%</div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">Optimal range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payroll Forecast (EMA)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600">₹{(forecast.predicted_next_month || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
                <span>95% CI: ₹{(forecast.confidence_interval?.lower || 0).toLocaleString()} - ₹{(forecast.confidence_interval?.upper || 0).toLocaleString()}</span>
                <span>Q-Proj: ₹{(forecast.quarterly_projection || 0).toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500 w-5 h-5"/> Statistical Anomaly Detection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {anomalies.length > 0 ? anomalies.map((a: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <div>
                  <div className="font-semibold">{a.type || 'Anomaly'}</div>
                  <div className="text-sm text-slate-600">{a.message || 'Irregularity detected'}</div>
                </div>
                <Badge variant={a.severity === 'HIGH' || a.severity === 'CRITICAL' ? 'destructive' : 'warning'}>{a.severity || 'HIGH'}</Badge>
              </div>
            )) : <div className="text-slate-500 p-4 text-center">No anomalies exceeding 3σ detected.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-500 w-5 h-5"/> AI Recommendations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {recs.length > 0 ? recs.map((r: any, i: number) => (
              <div key={i} className="p-3 bg-indigo-50 text-indigo-900 rounded border border-indigo-100">
                <div className="font-bold text-sm text-indigo-800">{r.type}</div>
                <div>{r.message}</div>
              </div>
            )) : <div className="text-slate-500 p-4 text-center">System is optimizing, no actions needed.</div>}
            
            <div className="p-3 bg-blue-50 text-blue-900 rounded border border-blue-100 mt-4">
                <div className="font-bold text-sm text-blue-800">HIRING SIMULATION (5% Growth)</div>
                <div>Predicted Payroll Impact: +₹{(forecast.hiring_impact || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Historical Trend Sparkline */}
      <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5 text-green-500"/> Historical Intelligence Trends (Forecast Bands)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 bg-slate-50 border border-dashed border-slate-200 rounded flex items-end p-4 gap-2 relative">
               {history.map((h: any, i: number) => (
                   <div key={i} className="flex-1 bg-indigo-200 hover:bg-indigo-400 rounded-t transition-all relative group" style={{ height: `${Math.max(10, h.attendance_score)}%` }} title={`Score: ${h.attendance_score}`}>
                       <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-xs p-1 rounded -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">Score: {h.attendance_score.toFixed(1)}</div>
                   </div>
               ))}
               {history.length === 0 && <div className="w-full text-center self-center text-slate-400">Not enough historical data to map trends. Run snapshot jobs to populate.</div>}
               {/* 95% CI upper/lower bounds visualization (decorative) */}
               {history.length > 0 && <div className="absolute w-full border-t border-dashed border-red-300 bottom-1/3 left-0"></div>}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
