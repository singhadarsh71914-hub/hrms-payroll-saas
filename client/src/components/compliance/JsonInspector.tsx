import React from 'react';

interface JsonInspectorProps {
  ruleType: string;
  configuration: any;
}

export function JsonInspector({ ruleType, configuration }: JsonInspectorProps) {
  if (!configuration) return <div className="text-sm text-gray-500 italic">No configuration available</div>;

  if (ruleType === 'PT') {
    const slabs = configuration.slabs || [];
    return (
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
        <div className="border-b border-slate-700/50 pb-1 mb-3 font-bold text-slate-100 uppercase tracking-wider text-xs">PT Rules</div>
        {slabs.length === 0 ? (
          <div>No slabs configured</div>
        ) : (
          <table className="w-full text-left mt-2">
            <thead>
              <tr className="text-slate-500 font-medium text-xs border-b border-slate-800">
                <th className="pb-2 font-medium">Income Range</th>
                <th className="pb-2 text-right font-medium">Monthly Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {slabs.map((slab: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 text-slate-300">
                    {slab.max ? `₹${slab.min.toLocaleString()}–₹${slab.max.toLocaleString()}` : `₹${slab.min.toLocaleString()}+`}
                  </td>
                  <td className="py-2 text-right text-slate-200 font-medium">
                    ₹{slab.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (ruleType === 'ESI') {
    return (
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
        <div className="border-b border-slate-700/50 pb-1 mb-3 font-bold text-slate-100 uppercase tracking-wider text-xs">ESI Rules</div>
        <div className="flex justify-between">
          <span className="text-slate-400">Employee:</span>
          <span className="text-slate-200">{configuration.employee_rate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Employer:</span>
          <span className="text-slate-200">{configuration.employer_rate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Threshold:</span>
          <span className="text-slate-200">₹{configuration.threshold?.toLocaleString() || configuration.threshold}</span>
        </div>
      </div>
    );
  }

  if (ruleType === 'LWF') {
    return (
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
        <div className="border-b border-slate-700/50 pb-1 mb-3 font-bold text-slate-100 uppercase tracking-wider text-xs">LWF Rules</div>
        <div className="flex justify-between">
          <span className="text-slate-400">Employee Contribution:</span>
          <span className="text-slate-200">₹{configuration.employee_amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Employer Contribution:</span>
          <span className="text-slate-200">₹{configuration.employer_amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Frequency:</span>
          <span className="text-slate-200">{configuration.frequency || 'Monthly'}</span>
        </div>
      </div>
    );
  }

  if (ruleType === 'GRATUITY') {
    return (
      <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
        <div className="border-b border-slate-700/50 pb-1 mb-3 font-bold text-slate-100 uppercase tracking-wider text-xs">Gratuity Policy</div>
        <div className="flex justify-between">
          <span className="text-slate-400">Minimum Service:</span>
          <span className="text-slate-200">{configuration.minimum_service_years || 5} Years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Days Factor:</span>
          <span className="text-slate-200">{configuration.days_factor || 15}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Working Days:</span>
          <span className="text-slate-200">{configuration.working_days || 26}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
       <div className="border-b border-slate-700/50 pb-1 mb-3 font-bold text-slate-100 uppercase tracking-wider text-xs">{ruleType} Rules</div>
       <div className="flex flex-col gap-1">
         {Object.entries(configuration || {}).map(([k, v]) => (
           <div key={k} className="flex justify-between">
             <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
             <span className="text-slate-200">{String(v)}</span>
           </div>
         ))}
       </div>
    </div>
  );
}
