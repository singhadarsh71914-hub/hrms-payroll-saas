import React from 'react';

export default function SystemOperations() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">System Operations Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">SYSTEM STATUS</h2>
          <ul className="space-y-3 font-medium">
            <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500"></span> PostgreSQL</li>
            <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500"></span> Redis</li>
            <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500"></span> Workers</li>
            <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500"></span> WebSockets</li>
            <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500"></span> SMTP</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">QUEUE STATUS</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-slate-400 text-sm font-semibold mb-1 uppercase">Payroll Jobs</h3>
              <p className="text-sm font-medium">Running: <span className="text-blue-400">2</span> &bull; Queued: 4 &bull; Failed: <span className="text-red-400">1</span></p>
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-semibold mb-1 uppercase">PDF Jobs</h3>
              <p className="text-sm font-medium">Running: 3 &bull; Queued: 8</p>
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-semibold mb-1 uppercase">DLQ</h3>
              <p className="text-sm font-medium text-red-400">5 items</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-2">METRICS</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">Payroll Duration</h3>
                <p className="text-2xl font-bold text-white">14s</p>
              </div>
              <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded-md">P95</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-slate-400 text-sm font-semibold mb-1">PDF Generation</h3>
                <p className="text-2xl font-bold text-white">2.1s</p>
              </div>
              <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded-md">P95</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-800">
               <div>
                  <h3 className="text-slate-400 text-xs font-semibold mb-1">Memory</h3>
                  <p className="font-bold">145MB</p>
               </div>
               <div>
                  <h3 className="text-slate-400 text-xs font-semibold mb-1">CPU</h3>
                  <p className="font-bold">32%</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-200">RECENT FAILURES</h2>
          <button className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700 text-slate-300">
            Download Logs
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-3 font-semibold rounded-tl-lg">Job ID</th>
                <th className="p-3 font-semibold">Queue</th>
                <th className="p-3 font-semibold">Error</th>
                <th className="p-3 font-semibold rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300 font-medium">
              <tr>
                <td className="p-3">#82xca12</td>
                <td className="p-3"><span className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-2 py-1 rounded-md text-xs">payroll-processing</span></td>
                <td className="p-3 text-red-400">DB Connection Timeout</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors border border-slate-700">Inspect</button>
                    <button className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition-colors text-white">Retry</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
