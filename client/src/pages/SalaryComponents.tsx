import React, { useState, useEffect } from 'react';
import { getSalaryComponents, createSalaryComponent, updateSalaryComponent, deleteSalaryComponent, duplicateSalaryComponent } from '../services/salary-components.service';
import { Plus, Edit, Trash2, Copy, ShieldAlert, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const componentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional().nullable(),
  type: z.enum(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'REIMBURSEMENT']),
  category: z.enum(['FIXED', 'VARIABLE', 'STATUTORY']),
  is_taxable: z.boolean(),
  is_statutory: z.boolean(),
  pf_applicable: z.boolean(),
  esi_applicable: z.boolean(),
  is_active: z.boolean(),
  calculation_type: z.string().nullable().optional(),
  formula: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
  max_limit: z.number().min(0).optional().nullable(),
  display_order: z.number().int().optional().nullable(),
  system_role: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.calculation_type?.startsWith('PERCENTAGE_')) {
    if (data.value !== undefined && data.value !== null && (data.value < 0 || data.value > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "value between 0–100 for percentages",
        path: ['value']
      });
    }
  }
});

type ComponentFormData = z.infer<typeof componentSchema>;

export default function SalaryComponents() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formulaStatus, setFormulaStatus] = useState<{valid: boolean, message?: string} | null>(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      type: 'EARNING',
      category: 'FIXED',
      is_taxable: true,
      is_statutory: false,
      pf_applicable: false,
      esi_applicable: false,
      is_active: true,
      display_order: 0
    }
  });

  const isSystemComponent = !!watch('system_role');
  const isTdsComponent = watch('system_role') === 'TDS';

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const data = await getSalaryComponents();
      setComponents(data);
    } catch (err) {
      toast.error('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateSalaryComponent(id);
      toast.success('Component duplicated');
      fetchComponents();
    } catch (err) {
      toast.error('Failed to duplicate component');
    }
  };

  const handleDelete = async (id: string, comp: any) => {
    if (comp.system_role) {
      return toast.error('Cannot delete system component');
    }
    if (confirm('Are you sure you want to archive this component?')) {
      try {
        await deleteSalaryComponent(id);
        toast.success('Component archived');
        fetchComponents();
      } catch (err) {
        toast.error('Failed to archive component');
      }
    }
  };

  const openModal = (comp?: any) => {
    if (comp) {
      setEditingId(comp.id);
      reset({
        name: comp.name,
        code: comp.code,
        description: comp.description || '',
        type: comp.type,
        category: comp.category,
        is_taxable: comp.is_taxable,
        is_statutory: comp.is_statutory,
        pf_applicable: comp.pf_applicable,
        esi_applicable: comp.esi_applicable,
        is_active: comp.is_active,
        calculation_type: comp.calculation_type || null,
        value: comp.value ? Number(comp.value) : null,
        max_limit: comp.max_limit ? Number(comp.max_limit) : null,
        display_order: Number(comp.display_order) || 0,
        system_role: comp.system_role || null
      });
    } else {
      setEditingId(null);
      reset({
        name: '',
        code: '',
        description: '',
        type: 'EARNING',
        category: 'FIXED',
        is_taxable: true,
        is_statutory: false,
        pf_applicable: false,
        esi_applicable: false,
        is_active: true,
        calculation_type: null,
        formula: null,
        value: null,
        max_limit: null,
        display_order: 0
      });
    }
    setFormulaStatus(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormulaStatus(null);
  };

  const onSubmit = async (data: ComponentFormData) => {
    try {
      if (editingId) {
        await updateSalaryComponent(editingId, data);
        toast.success('Component updated successfully');
      } else {
        await createSalaryComponent(data);
        toast.success('Component created successfully');
      }
      closeModal();
      fetchComponents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  if (loading) return <div className="page-container"><div className="page-header"><h1 className="page-title">Loading...</h1></div></div>;

  const filteredComponents = components.filter(c => showArchived ? true : c.is_active);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Components</h1>
          <p className="page-subtitle">Configure EARNING, DEDUCTION, and EMPLOYER_CONTRIBUTION components.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)} 
            />
            Show Archived
          </label>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} /> New Component
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Calc Type</th>
              <th>Value</th>
              <th>Active</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComponents.map(comp => {
              const isSys = !!comp.system_role;
              return (
                <tr key={comp.id} style={{ opacity: comp.is_active ? 1 : 0.6 }}>
                  <td>
                    {comp.name}
                    {isSys && <Lock size={12} style={{ marginLeft: 6, color: 'var(--text-muted)' }} />}
                  </td>
                  <td><span className="badge badge-secondary">{comp.code}</span></td>
                  <td>{comp.type}</td>
                  <td>{comp.calculation_type || '-'}</td>
                  <td>{comp.value !== null ? comp.value : '-'}</td>
                  <td>{comp.is_active ? 'Yes' : 'No'}</td>
                  <td className="text-right">
                    <div className="action-buttons" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openModal(comp)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDuplicate(comp.id)} title="Duplicate">
                        <Copy size={16} />
                      </button>
                      {!comp.system_role && comp.is_active && (
                        <button className="btn-icon" onClick={() => handleDelete(comp.id, comp)} title="Archive">
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredComponents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>No components found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Component' : 'New Component'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>General</h4>
                {isTdsComponent && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    TDS is calculated automatically according to tax rules.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Name</label>
                    <input {...register('name')} className="form-control" disabled={isTdsComponent} />
                    {errors.name && <span className="error-text">{errors.name.message}</span>}
                  </div>
                  <div>
                    <label>Code {isSystemComponent && <Lock size={12} style={{ marginLeft: 4 }} />}</label>
                    <input {...register('code')} className="form-control" disabled={isTdsComponent || (!!editingId && isSystemComponent)} />
                    {errors.code && <span className="error-text">{errors.code.message}</span>}
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label>Description</label>
                  <input {...register('description')} className="form-control" disabled={isTdsComponent} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Type & Calculation</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Type</label>
                    <select {...register('type')} className="form-control" disabled={isTdsComponent}>
                      <option value="EARNING">EARNING</option>
                      <option value="DEDUCTION">DEDUCTION</option>
                      <option value="EMPLOYER_CONTRIBUTION">EMPLOYER_CONTRIBUTION</option>
                      <option value="REIMBURSEMENT">REIMBURSEMENT</option>
                    </select>
                  </div>
                  <div>
                    <label>Calculation Type</label>
                    <select {...register('calculation_type')} className="form-control" disabled={isTdsComponent}>
                      <option value="">-- None --</option>
                      <option value="PERCENTAGE_OF_CTC">PERCENTAGE_OF_CTC</option>
                      <option value="PERCENTAGE_OF_BASIC">PERCENTAGE_OF_BASIC</option>
                      <option value="PERCENTAGE_OF_GROSS">PERCENTAGE_OF_GROSS</option>
                      <option value="FLAT_AMOUNT">FLAT_AMOUNT</option>
                      <option value="REMAINDER_OF_CTC">REMAINDER_OF_CTC</option>
                      <option value="FORMULA">FORMULA</option>
                    </select>
                  </div>
                  {watch('calculation_type') === 'FORMULA' ? (
                    <div style={{ gridColumn: 'span 1' }}>
                      <label>Formula (e.g. <code>basic * 0.12</code>)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" {...register('formula')} className="form-control" disabled={isTdsComponent} placeholder="min(basic * 0.12, 1800)" />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={async () => {
                          const formula = watch('formula');
                          if (!formula) return;
                          try {
                            const res = await api.post('/api/salary-components/validate-formula', { formula });
                            if (res.data.valid) setFormulaStatus({ valid: true, message: 'Valid' });
                          } catch (err: any) {
                            setFormulaStatus({ valid: false, message: err.response?.data?.error || 'Invalid formula' });
                          }
                        }}>Validate Formula</button>
                      </div>
                      {formulaStatus && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: formulaStatus.valid ? '#10b981' : '#ef4444' }}>
                          {formulaStatus.valid ? `✓ ${formulaStatus.message}` : `✗ ${formulaStatus.message}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label>Value</label>
                      <input type="number" step="0.01" {...register('value', { valueAsNumber: true })} className="form-control" disabled={isTdsComponent} />
                      {errors.value && <span className="error-text">{errors.value.message}</span>}
                    </div>
                  )}
                  <div>
                    <label>Max Limit</label>
                    <input type="number" step="0.01" {...register('max_limit', { valueAsNumber: true })} className="form-control" disabled={isTdsComponent} />
                    {errors.max_limit && <span className="error-text">{errors.max_limit.message}</span>}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Configuration</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Display Order</label>
                    <input type="number" {...register('display_order', { valueAsNumber: true })} className="form-control" disabled={isTdsComponent} />
                    {errors.display_order && <span className="error-text">{errors.display_order.message}</span>}
                  </div>
                  <div>
                    <label>Category</label>
                    <select {...register('category')} className="form-control" disabled={isTdsComponent}>
                      <option value="FIXED">FIXED</option>
                      <option value="VARIABLE">VARIABLE</option>
                      <option value="STATUTORY">STATUTORY</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" {...register('is_taxable')} disabled={isTdsComponent} /> Taxable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" {...register('is_active')} disabled={isTdsComponent} /> Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" {...register('pf_applicable')} disabled={isTdsComponent} /> PF Applicable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" {...register('esi_applicable')} disabled={isTdsComponent} /> ESI Applicable
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{isTdsComponent ? 'Close' : 'Cancel'}</button>
                {!isTdsComponent && <button type="submit" className="btn btn-primary">Save Component</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
