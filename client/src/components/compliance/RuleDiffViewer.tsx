import React from 'react';
import { JsonInspector } from './JsonInspector';

interface DiffViewerProps {
  v1: any;
  v2: any;
  isOpen: boolean;
  onClose: () => void;
}

export function RuleDiffViewer({ v1, v2, isOpen, onClose }: DiffViewerProps) {
  if (!isOpen) return null;

  const compareObjects = (oldObj: any, newObj: any) => {
    const changes: any[] = [];
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    
    allKeys.forEach(key => {
      if (key === 'slabs' && Array.isArray(oldObj[key]) && Array.isArray(newObj[key])) {
         const oldSlabs = oldObj[key];
         const newSlabs = newObj[key];
         newSlabs.forEach((slab: any, idx: number) => {
           if (!oldSlabs[idx]) {
             changes.push({ type: 'added', msg: `Added slab: ₹${slab.min} - ${slab.max ? '₹'+slab.max : 'Above'} (₹${slab.amount})` });
           } else if (JSON.stringify(slab) !== JSON.stringify(oldSlabs[idx])) {
             changes.push({ type: 'changed', msg: `Changed slab ${idx+1}: ₹${oldSlabs[idx].amount} → ₹${slab.amount}` });
           }
         });
         oldSlabs.forEach((slab: any, idx: number) => {
           if (!newSlabs[idx]) {
             changes.push({ type: 'removed', msg: `Removed slab: ₹${slab.min} - ${slab.max ? '₹'+slab.max : 'Above'}` });
           }
         });
      } else {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (oldVal === undefined && newVal !== undefined) {
          changes.push({ type: 'added', msg: `Added ${key}: ${newVal}` });
        } else if (oldVal !== undefined && newVal === undefined) {
          changes.push({ type: 'removed', msg: `Removed ${key}: ${oldVal}` });
        } else if (oldVal !== newVal) {
          changes.push({ type: 'changed', msg: `Changed ${key}: ${oldVal} → ${newVal}` });
        }
      }
    });
    return changes;
  };

  const differences = compareObjects(v1?.configuration, v2?.configuration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">v{v1?.version}</span>
            <span className="text-slate-500">vs</span>
            <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">v{v2?.version}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 flex flex-col gap-6">
          
          <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Semantic Differences</h3>
            {differences.length === 0 ? (
              <div className="text-slate-500 italic text-sm">No configuration changes found between versions.</div>
            ) : (
              <ul className="space-y-3">
                {differences.map((diff, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {diff.type === 'changed' && <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/30">🟡 CHANGED</span>}
                    {diff.type === 'added' && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/30">🟢 ADDED</span>}
                    {diff.type === 'removed' && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-500/30">🔴 REMOVED</span>}
                    <span className="text-slate-300 pt-0.5">{diff.msg}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Version {v1?.version} (Older)</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                <JsonInspector ruleType={v1?.rule_type} configuration={v1?.configuration} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Version {v2?.version} (Newer)</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                <JsonInspector ruleType={v2?.rule_type} configuration={v2?.configuration} />
              </div>
            </div>
          </div>

        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
