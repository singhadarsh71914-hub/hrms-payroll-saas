import React from 'react';

export default function DiversityAnalytics() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Diversity & Inclusion Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Gender Representation</h3>
          <p className="text-2xl font-bold text-white">42% Female</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Leadership Diversity</h3>
          <p className="text-2xl font-bold text-white">31% Female</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Pay Equity Gap</h3>
          <p className="text-2xl font-bold text-green-400">1.2%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-slate-800 pb-2">Hiring Diversity (L12M)</h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex justify-between"><span>Female Hires</span><span className="font-medium text-white">48%</span></div>
            <div className="flex justify-between"><span>Male Hires</span><span className="font-medium text-white">52%</span></div>
            <div className="flex justify-between"><span>Underrepresented</span><span className="font-medium text-white">14%</span></div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-slate-800 pb-2">Promotion Distribution</h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex justify-between"><span>Female Promoted</span><span className="font-medium text-white">45%</span></div>
            <div className="flex justify-between"><span>Male Promoted</span><span className="font-medium text-white">55%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
