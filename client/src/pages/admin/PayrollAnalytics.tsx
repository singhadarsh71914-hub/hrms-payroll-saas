import React from 'react';

export default function PayrollAnalytics() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Payroll Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Total Liability</h3>
          <p className="text-2xl font-bold text-white">₹14.2 Cr</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Employer PF</h3>
          <p className="text-2xl font-bold text-blue-400">₹1.1 Cr</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Tax TDS</h3>
          <p className="text-2xl font-bold text-red-400">₹2.8 Cr</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Overtime</h3>
          <p className="text-2xl font-bold text-orange-400">₹12 L</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-slate-800 pb-2">Department-wise Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-slate-300">Engineering</span><span className="font-medium">₹6.4 Cr</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">Sales</span><span className="font-medium">₹4.1 Cr</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">Operations</span><span className="font-medium">₹2.2 Cr</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">HR & Admin</span><span className="font-medium">₹1.5 Cr</span></div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-slate-800 pb-2">Salary Band Analysis</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-slate-300">&gt; 50 LPA</span><span className="font-medium">12%</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">20 - 50 LPA</span><span className="font-medium">34%</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">10 - 20 LPA</span><span className="font-medium">41%</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-300">&lt; 10 LPA</span><span className="font-medium">13%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
