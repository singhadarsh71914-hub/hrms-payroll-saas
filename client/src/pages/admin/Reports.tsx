import React from 'react';

export default function Reports() {
  const templates = [
    'Payroll Summary',
    'Headcount Report',
    'Attendance Report',
    'Compliance Report',
    'Diversity Report',
    'Attrition Report'
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Advanced Report Builder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all flex flex-col justify-between h-48">
            <h2 className="text-xl font-semibold text-slate-200">{template}</h2>
            <div className="flex gap-2 mt-4">
              <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded transition-colors text-white border border-slate-700">PDF</button>
              <button className="bg-green-900/40 hover:bg-green-800/60 text-green-400 text-xs px-3 py-1.5 rounded transition-colors border border-green-800/50">Excel</button>
              <button className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 text-xs px-3 py-1.5 rounded transition-colors border border-blue-800/50">CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
