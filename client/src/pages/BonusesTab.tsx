import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';

const bonusSchema = z.object({
  type: z.enum(['JOINING', 'PERFORMANCE', 'RETENTION', 'FESTIVAL', 'REFERRAL', 'SALES_COMMISSION', 'OVERTIME', 'OTHER']),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  taxable: z.boolean(),
  recurring: z.boolean(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  effective_month: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
}).refine(data => !data.recurring || data.start_date, {
  message: "Start date is required for recurring bonuses",
  path: ["start_date"],
});

type BonusFormData = z.infer<typeof bonusSchema>;

const mapTypeToCategory = (type: string) => {
  if (['SALES_COMMISSION', 'OVERTIME', 'PERFORMANCE'].includes(type)) return 'VARIABLE_COMPENSATION';
  return 'FIXED_BONUS';
};

export const BonusesTab = ({ employeeId }: { employeeId: string }) => {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<BonusFormData>({
    resolver: zodResolver(bonusSchema),
    defaultValues: { taxable: true, recurring: false, type: 'OTHER', status: 'APPROVED' }
  });

  const isRecurring = watch('recurring');
  const watchType = watch('type');
  const isVariableComp = mapTypeToCategory(watchType) === 'VARIABLE_COMPENSATION';

  const fetchBonuses = async () => {
    try {
      const res = await api.get(`/api/employees/${employeeId}/bonuses`);
      setBonuses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBonuses();
  }, [employeeId]);

  const onSubmit = async (data: BonusFormData) => {
    try {
      const payload = { ...data, category: mapTypeToCategory(data.type) };
      if (editingId) {
        await api.put(`/api/employees/${employeeId}/bonuses/${editingId}`, payload);
      } else {
        await api.post(`/api/employees/${employeeId}/bonuses`, payload);
      }
      setIsModalOpen(false);
      reset();
      fetchBonuses();
    } catch (err) {
      console.error(err);
      alert('Failed to save bonus');
    }
  };

  const handleEdit = (bonus: any) => {
    setEditingId(bonus.id);
    reset({
      type: bonus.type,
      name: bonus.name,
      description: bonus.description || '',
      amount: Number(bonus.amount),
      taxable: bonus.taxable,
      recurring: bonus.recurring,
      start_date: bonus.start_date ? new Date(bonus.start_date).toISOString().split('T')[0] : '',
      end_date: bonus.end_date ? new Date(bonus.end_date).toISOString().split('T')[0] : '',
      effective_month: bonus.effective_month || '',
      status: bonus.status || 'APPROVED'
    });
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this bonus?')) {
      try {
        await api.delete(`/api/employees/${employeeId}/bonuses/${id}`);
        fetchBonuses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNew = () => {
    setEditingId(null);
    reset({ type: 'OTHER', name: '', amount: 0, taxable: true, recurring: false, status: 'APPROVED' });
    setIsModalOpen(true);
  };

  const fixedBonuses = bonuses.filter(b => b.category === 'FIXED_BONUS');
  const variableComps = bonuses.filter(b => b.category === 'VARIABLE_COMPENSATION');

  const renderTable = (dataList: any[], title: string) => (
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{ color: '#f1f5f9', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem' }}>{title}</h4>
      <div className="premium-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>NAME / TYPE</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>AMOUNT</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>TIMING</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>STATUS</th>
              <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {dataList.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
            ) : dataList.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ color: '#f1f5f9', fontWeight: '600' }}>{b.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{b.type.replace('_', ' ')}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: '#10b981', fontWeight: '700' }}>₹{Number(b.amount).toLocaleString()}</td>
                <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  {b.recurring ? (
                    <span>Recurring<br/><span style={{ color: '#64748b', fontSize: '0.8rem' }}>From {new Date(b.start_date).toLocaleDateString()}</span></span>
                  ) : (
                    <span>One-time<br/><span style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.effective_month || 'N/A'}</span></span>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {b.status === 'APPROVED' ? <span className="badge badge-success">APPROVED</span> : 
                   b.status === 'PENDING' ? <span className="badge badge-warning">PENDING</span> : 
                   <span className="badge badge-danger">REJECTED</span>}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" disabled={b.category === 'FIXED_BONUS' && b.status === 'APPROVED'} onClick={() => handleEdit(b)}><Edit2 size={14} /></button>
                    <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => handleArchive(b.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: '600' }}>Bonuses & Incentives</h3>
        <button className="btn btn-primary btn-sm" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Add Bonus
        </button>
      </div>

      {renderTable(fixedBonuses, 'FIXED BONUSES')}
      {renderTable(variableComps, 'VARIABLE COMPENSATION')}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Bonus' : 'Add Bonus'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" {...register('type')}>
                  {['JOINING', 'PERFORMANCE', 'RETENTION', 'FESTIVAL', 'REFERRAL', 'SALES_COMMISSION', 'OVERTIME', 'OTHER'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
                {errors.type && <span className="error-text">{errors.type.message}</span>}
              </div>

              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-control" {...register('name')} />
                {errors.name && <span className="error-text">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input type="number" className="form-control" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <span className="error-text">{errors.amount.message}</span>}
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-control" {...register('status')}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                {errors.status && <span className="error-text">{errors.status.message}</span>}
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" {...register('taxable')} id="taxable" />
                <label htmlFor="taxable" style={{ margin: 0 }}>Taxable</label>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isVariableComp ? 0.5 : 1 }}>
                <input type="checkbox" {...register('recurring')} id="recurring" disabled={isVariableComp} />
                <label htmlFor="recurring" style={{ margin: 0 }}>Recurring Bonus</label>
              </div>

              {isRecurring ? (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Start Date</label>
                    <input type="date" className="form-control" {...register('start_date')} />
                    {errors.start_date && <span className="error-text">{errors.start_date.message}</span>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>End Date (Optional)</label>
                    <input type="date" className="form-control" {...register('end_date')} />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Effective Month (YYYY-MM)</label>
                  <input type="month" className="form-control" {...register('effective_month')} />
                  <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Leave empty if it shouldn't apply automatically</small>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Bonus</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
