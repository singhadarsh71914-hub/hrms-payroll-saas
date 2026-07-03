import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function WorkforceAnalytics() {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Mock 100k employees for demonstration of virtualization
  const [employees] = useState(() => Array.from({ length: 100000 }, (_, i) => ({
    id: `EMP-${i + 1}`,
    name: `Employee ${i + 1}`,
    department: ['Engineering', 'Sales', 'HR', 'Marketing'][i % 4],
    tenure: `${(i % 10) + 1} years`,
    gender: i % 3 === 0 ? 'Female' : 'Male',
  })));

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-8">Workforce Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Headcount Growth</h3>
          <p className="text-2xl font-bold">+12.4% <span className="text-sm font-normal text-slate-500">YTD</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Gender Ratio</h3>
          <p className="text-2xl font-bold">42% / 58% <span className="text-sm font-normal text-slate-500">F/M</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Average Tenure</h3>
          <p className="text-2xl font-bold">4.2 <span className="text-sm font-normal text-slate-500">Years</span></p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <h2 className="text-xl font-semibold mb-4 border-b border-slate-800 pb-4">Global Directory (Virtual 100k Records)</h2>
        <div 
          ref={parentRef} 
          className="h-[500px] overflow-auto rounded-lg border border-slate-800"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const employee = employees[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className="absolute top-0 left-0 w-full flex items-center px-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="w-1/5 font-mono text-slate-400">{employee.id}</div>
                  <div className="w-2/5 font-medium">{employee.name}</div>
                  <div className="w-1/5 text-slate-300">{employee.department}</div>
                  <div className="w-1/5 text-right text-slate-400">{employee.tenure}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
