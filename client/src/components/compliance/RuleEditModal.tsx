import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ptSchema = z.object({
  slabs: z.array(z.object({
    min: z.coerce.number().min(0),
    max: z.coerce.number().nullable(),
    amount: z.coerce.number().min(0)
  }))
});

const defaultSchema = z.any();

interface RuleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: any;
  onSave: (id: string, newConfig: any) => Promise<void>;
}

export function RuleEditModal({ isOpen, onClose, rule, onSave }: RuleEditModalProps) {
  const isPT = rule?.rule_type === 'PT';
  const schema = isPT ? ptSchema : defaultSchema;

  const { register, control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      slabs: rule?.configuration?.slabs || []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slabs"
  });

  useEffect(() => {
    if (rule) {
      reset({ slabs: rule?.configuration?.slabs || [] });
    }
  }, [rule, reset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !rule) return null;

  const onSubmit = async (data: any) => {
    try {
      const newConfig = isPT ? data : rule.configuration; 
      // For ESI/LWF we just return the existing if not edited (for simplicity we focus PT dynamic editor)
      await onSave(rule.id, newConfig);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col my-auto max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Edit Rule 
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs ml-2 uppercase tracking-wide">
                {rule.rule_type} • {rule.state_code}
              </span>
            </h2>
            <div className="text-xs text-slate-500 mt-1 flex gap-2">
              <span>v{rule.version}</span>
              <span>•</span>
              <span>{format(new Date(rule.effective_from), "MMM d, yyyy")} - {new Date(rule.effective_to).getFullYear() > 2090 ? 'Open-ended' : format(new Date(rule.effective_to), "MMM d, yyyy")}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
          {isPT ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-300">Tax Slabs</h3>
                <button type="button" onClick={() => append({ min: 0, max: null, amount: 0 })} className="text-xs flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors">
                  <Plus size={14} /> Add Slab
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 group">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Min Salary (₹)</label>
                        <input {...register(`slabs.${index}.min`, { valueAsNumber: true })} type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                        {(errors.slabs as any)?.[index]?.min && <p className="text-[10px] text-red-400 mt-1">{(errors.slabs as any)[index]?.min?.message}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Max Salary (₹)</label>
                        <input {...register(`slabs.${index}.max`, { valueAsNumber: true })} type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Empty = Above" />
                        {(errors.slabs as any)?.[index]?.max && <p className="text-[10px] text-red-400 mt-1">{(errors.slabs as any)[index]?.max?.message}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Tax Amount (₹)</label>
                        <input {...register(`slabs.${index}.amount`, { valueAsNumber: true })} type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                        {(errors.slabs as any)?.[index]?.amount && <p className="text-[10px] text-red-400 mt-1">{(errors.slabs as any)[index]?.amount?.message}</p>}
                      </div>
                    </div>
                    <button type="button" onClick={() => remove(index)} aria-label="Remove Slab" className="mt-5 p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="text-slate-400 text-sm italic py-8 text-center bg-slate-800/20 rounded-xl border border-slate-700/30">
               Dynamic editor for {rule.rule_type} is not implemented in this demo.
             </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
