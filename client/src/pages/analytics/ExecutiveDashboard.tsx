import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { Calendar } from 'lucide-react';

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [payrollTrends, setPayrollTrends] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [attrition, setAttrition] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [kpiRes, payrollRes, deptRes, attrRes] = await Promise.all([
          api.get('/analytics/kpis'),
          api.get('/analytics/payroll-trends'),
          api.get('/analytics/departments'),
          api.get('/analytics/attrition')
        ]);
        setKpis(kpiRes.data);
        setPayrollTrends(payrollRes.data);
        setDepartments(deptRes.data);
        setAttrition(attrRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExport = async (type: string) => {
    try {
      await api.post(`/reports/${type}`);
      alert(`Report export for ${type} queued successfully!`);
    } catch (err) {
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-12 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  const genderData = [
    { name: 'Male', value: kpis?.genderDistribution?.male || 0 },
    { name: 'Female', value: kpis?.genderDistribution?.female || 0 },
    { name: 'Other', value: kpis?.genderDistribution?.other || 0 },
  ];
  const COLORS = ['var(--primary)', '#ec4899', 'var(--secondary)'];

  return (
    <div className="p-8 max-w-[1400px] mx-auto text-white bg-slate-950 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Executive Intelligence</h1>
          <p className="text-slate-400 mt-2">Real-time business health and workforce analytics.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleExport('executive')} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Export PDF</button>
          <button onClick={() => handleExport('payroll')} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar size={48} />
          </div>
          <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Total Employees</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{kpis?.activeEmployees}</span>
            <span className="text-sm text-slate-500">/ {kpis?.totalEmployees} total</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Monthly Payroll</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">₹{(kpis?.monthlyPayrollCost / 10000000).toFixed(2)}Cr</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Avg: ₹{(kpis?.averageSalary / 100000).toFixed(2)}L per emp</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Attrition Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-red-400">{kpis?.attritionRate}%</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">L6M Trend</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Compliance Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-green-400">{kpis?.complianceScore}%</span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Zero critical violations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-6">Payroll & Employer Liability Trends</h2>
          <div className="h-72">
            {payrollTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 'var(--radius-md)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="gross" stroke="var(--primary)" fillOpacity={1} fill="url(#colorGross)" name="Gross Payroll" strokeWidth={3} />
                  <Area type="monotone" dataKey="contributions" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} name="Employer Liab" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-6">Department Headcount & Cost</h2>
          <div className="h-72">
            {departments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} />
                  <YAxis dataKey="department" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 'var(--radius-md)' }} />
                  <Legend />
                  <Bar dataKey="cost" fill="var(--secondary)" name="Payroll Cost" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-6">Gender Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {genderData.map((entry, index) => (
                    <Cell key={entry.name || `cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 'var(--radius-md)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-6">Attrition by Department</h2>
          <div className="h-64">
             {attrition.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attrition} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="department" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 'var(--radius-md)' }} />
                  <Bar dataKey="exits" fill="var(--danger)" name="Exits" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
