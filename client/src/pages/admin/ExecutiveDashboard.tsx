import React from 'react';

export default function ExecutiveDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Executive Intelligence Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* WORKFORCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">WORKFORCE</h2>
          <div className="space-y-4">
            <div><p className="text-sm text-slate-400">Employees</p><p className="text-2xl font-bold text-white">3,245</p></div>
            <div><p className="text-sm text-slate-400">Growth</p><p className="text-xl font-medium text-green-400">+8.2%</p></div>
            <div><p className="text-sm text-slate-400">Attrition</p><p className="text-xl font-medium text-red-400">4.1%</p></div>
            <div><p className="text-sm text-slate-400">Open Positions</p><p className="text-xl font-medium text-blue-400">87</p></div>
          </div>
        </div>

        {/* FINANCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">FINANCE</h2>
          <div className="space-y-4">
            <div><p className="text-sm text-slate-400">Monthly Payroll</p><p className="text-2xl font-bold text-white">₹4.2 Cr</p></div>
            <div><p className="text-sm text-slate-400">Employer Cost</p><p className="text-xl font-medium text-white">₹4.8 Cr</p></div>
            <div><p className="text-sm text-slate-400">Average CTC</p><p className="text-xl font-medium text-white">₹15.4 LPA</p></div>
            <div><p className="text-sm text-slate-400">Bonus Spend</p><p className="text-xl font-medium text-yellow-400">₹32 L</p></div>
          </div>
        </div>

        {/* ATTENDANCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">ATTENDANCE</h2>
          <div className="space-y-4">
            <div><p className="text-sm text-slate-400">Attendance Rate</p><p className="text-2xl font-bold text-green-400">96.8%</p></div>
            <div><p className="text-sm text-slate-400">Late Marks</p><p className="text-xl font-medium text-orange-400">3.2%</p></div>
            <div><p className="text-sm text-slate-400">Overtime Hours</p><p className="text-xl font-medium text-blue-400">1,284</p></div>
            <div><p className="text-sm text-slate-400">Leaves</p><p className="text-xl font-medium text-slate-300">542</p></div>
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">PERFORMANCE</h2>
          <div className="space-y-4">
            <div><p className="text-sm text-slate-400">High Performers</p><p className="text-2xl font-bold text-green-400">18%</p></div>
            <div><p className="text-sm text-slate-400">Average Rating</p><p className="text-xl font-medium text-white">4.1</p></div>
            <div><p className="text-sm text-slate-400">Promotion Candidates</p><p className="text-xl font-medium text-blue-400">67</p></div>
            <div><p className="text-sm text-slate-400">Low Engagement</p><p className="text-xl font-medium text-red-400">32</p></div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">AI Recommendations</h2>
        <ul className="space-y-2">
           <li className="flex gap-3 text-slate-300"><span className="text-blue-500">→</span> Engineering overtime increased 24% this quarter.</li>
           <li className="flex gap-3 text-slate-300"><span className="text-blue-500">→</span> Sales attrition risk is above company average.</li>
           <li className="flex gap-3 text-slate-300"><span className="text-blue-500">→</span> Female leadership representation improved by 8%.</li>
           <li className="flex gap-3 text-slate-300"><span className="text-blue-500">→</span> Payroll expenses projected to increase by ₹42L next quarter.</li>
        </ul>
      </div>
    </div>
  );
}
