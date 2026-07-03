import React from 'react';
import { Settings, Copy, Archive, Clock3, Pencil } from 'lucide-react';
import { JsonInspector } from './JsonInspector';
import { format } from 'date-fns';

interface ComplianceRuleCardProps {
  rule: any;
  onDuplicate: (rule: any) => void;
  onArchive: (id: string) => void;
  onEdit: (rule: any) => void;
  onHistoryToggle: () => void;
}

export function ComplianceRuleCard({ rule, onDuplicate, onArchive, onEdit, onHistoryToggle }: ComplianceRuleCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl hover:shadow-blue-500/10 transition-all p-5 flex flex-col h-full">
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings size={20} className="text-slate-400" />
            {rule.rule_type} <span className="text-slate-500 font-normal text-lg">•</span> {rule.state_code}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {rule.is_active ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> ACTIVE
              </span>
            ) : (
              <span className="bg-slate-700/40 text-slate-400 border border-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span> ARCHIVED
              </span>
            )}
            <span className="bg-blue-500/15 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
              v{rule.version}
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-slate-400 mb-4 space-y-1">
        <div>
          <span className="text-slate-500">Effective:</span> <span className="font-medium text-slate-300">{format(new Date(rule.effective_from), "MMM d, yyyy")}</span>
        </div>
        <div>
          <span className="text-slate-500">Ends:</span> <span className="font-medium text-slate-300">
            {new Date(rule.effective_to).getFullYear() > 2090 ? 'Open-ended' : format(new Date(rule.effective_to), "MMM d, yyyy")}
          </span>
        </div>
      </div>
      
      <div className="flex-1 mb-6">
         <JsonInspector ruleType={rule.rule_type} configuration={rule.configuration} />
      </div>
      
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
        <button 
          onClick={onHistoryToggle}
          aria-label="View History"
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Clock3 size={16} /> History
        </button>
        <button 
          onClick={() => onEdit(rule)}
          aria-label="Edit Rule"
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Pencil size={16} /> Edit
        </button>
        <button 
          onClick={() => onDuplicate(rule)}
          aria-label="Duplicate Rule"
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Copy size={16} /> Duplicate
        </button>
        {rule.is_active ? (
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to archive this rule version?')) {
                onArchive(rule.id);
              }
            }}
            aria-label="Archive Rule"
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Archive size={16} /> Archive
          </button>
        ) : (
          <button 
            disabled 
            aria-label="Rule Archived"
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-slate-500 bg-slate-800/40 cursor-not-allowed opacity-70"
          >
            <Archive size={16} /> Archived
          </button>
        )}
      </div>
    </div>
  );
}
