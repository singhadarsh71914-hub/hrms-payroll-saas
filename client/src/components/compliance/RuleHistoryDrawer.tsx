import React from 'react';
import { History, X } from 'lucide-react';
import { format } from 'date-fns';

interface RuleHistoryDrawerProps {
  history: any[];
  isOpen: boolean;
  onClose: () => void;
  onCompare: (v1: any, v2: any) => void;
}

export function RuleHistoryDrawer({ history, isOpen, onClose, onCompare }: RuleHistoryDrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <History size={18} className="text-blue-400" />
          Version History
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 pb-4">
          {history.map((rule, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={rule.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-900 ${rule.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${rule.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {rule.is_active ? 'ACTIVE' : 'ARCHIVED'}
                      </span>
                      <span className="font-bold text-slate-200">v{rule.version}</span>
                    </div>
                    {idx < history.length - 1 && (
                      <button 
                        onClick={() => onCompare(history[idx + 1], rule)}
                        className="text-xs uppercase tracking-wider font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                      >
                        Compare
                      </button>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-400 flex items-center gap-2">
                    <span>{format(new Date(rule.effective_from), "MMM d, yyyy")}</span>
                    <span>→</span>
                    <span>{new Date(rule.effective_to).getFullYear() > 2090 ? 'Present' : format(new Date(rule.effective_to), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
