import React, { useState, useEffect } from 'react';
import { getSalaryStructures, createSalaryStructure, updateSalaryStructure, deleteSalaryStructure, duplicateSalaryStructure, assignSalaryStructure } from '../services/salary-structures.service';
import { getSalaryComponents } from '../services/salary-components.service';
import { Plus, Edit, Trash2, Copy, ShieldAlert, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Users, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalaryStructures() {
  const [structures, setStructures] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
  
  const [assignData, setAssignData] = useState({ structureId: '', employeeIds: '', effectiveFrom: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [structs, comps] = await Promise.all([
        getSalaryStructures(),
        getSalaryComponents()
      ]);
      setStructures(structs);
      setAvailableComponents(comps.filter((c: any) => c.is_active));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateSalaryStructure(id);
      toast.success('Structure duplicated');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to duplicate');
    }
  };

  const handleDelete = async (struct: any) => {
    if (struct.name === 'Standard Indian Corporate') {
      return toast.error('Cannot delete system structures');
    }
    if (struct.employee_count > 0) {
      return toast.error('Cannot archive a structure assigned to active employees');
    }
    if (confirm('Archive this structure?')) {
      try {
        await deleteSalaryStructure(struct.id);
        toast.success('Structure archived');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to archive');
      }
    }
  };

  const openModal = (struct?: any) => {
    if (struct) {
      if (struct.name === 'Standard Indian Corporate') {
        return toast.error('System structures cannot be modified directly');
      }
      setEditingId(struct.id);
      setFormData({ name: struct.name, description: struct.description || '' });
      setSelectedComponents(struct.components.map((c: any) => ({
        ...c.salary_component,
        salary_component_id: c.salary_component_id,
        calculation_type: c.calculation_type,
        value: c.value !== null ? Number(c.value) : '',
        max_limit: c.max_limit !== null ? Number(c.max_limit) : '',
        sequence: c.sequence
      })));
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
      setSelectedComponents([]);
    }
    setIsModalOpen(true);
  };

  const addComponent = (comp: any) => {
    if (selectedComponents.some(c => c.id === comp.id)) {
      return toast.error('Component already added');
    }
    setSelectedComponents([...selectedComponents, { 
      ...comp, 
      salary_component_id: comp.id,
      sequence: selectedComponents.length + 1
    }]);
  };

  const removeComponent = (id: string) => {
    setSelectedComponents(selectedComponents.filter(c => c.id !== id));
  };

  const moveComponent = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index > 0) {
      const newComps = [...selectedComponents];
      [newComps[index - 1], newComps[index]] = [newComps[index], newComps[index - 1]];
      setSelectedComponents(newComps);
    } else if (direction === 'DOWN' && index < selectedComponents.length - 1) {
      const newComps = [...selectedComponents];
      [newComps[index + 1], newComps[index]] = [newComps[index], newComps[index + 1]];
      setSelectedComponents(newComps);
    }
  };

  const updateSelectedComp = (index: number, field: string, value: any) => {
    const newComps = [...selectedComponents];
    newComps[index][field] = value;
    setSelectedComponents(newComps);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        components: selectedComponents.map((c, idx) => ({
          salary_component_id: c.id,
          calculation_type: c.calculation_type || undefined,
          value: c.value === '' ? null : Number(c.value),
          max_limit: c.max_limit === '' ? null : Number(c.max_limit),
          sequence: idx + 1 // Re-index sequences strictly
        }))
      };

      if (editingId) {
        await updateSalaryStructure(editingId, payload);
        toast.success('Structure updated');
      } else {
        await createSalaryStructure(payload);
        toast.success('Structure created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Validation failed');
      // If it throws an array of Zod issues, we can log them, but toast usually shows first error string if mapped in backend.
      // Wait, our backend validation returns `{ error: issues }` or similar if generic. We'll stick to a simple toast for demo.
    }
  };

  const handleAssign = async () => {
    try {
      const ids = assignData.employeeIds.split(',').map(s => s.trim()).filter(Boolean);
      await assignSalaryStructure(assignData.structureId, {
        employeeIds: ids,
        effectiveFrom: assignData.effectiveFrom
      });
      toast.success('Assigned structure successfully');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Structures</h1>
          <p className="page-subtitle">Manage company payroll structures and assign them to employees.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => {
            setAssignData({ structureId: structures[0]?.id || '', employeeIds: '', effectiveFrom: '' });
            setIsAssignModalOpen(true);
          }}>
            <Users size={18} /> Bulk Assign
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} /> New Structure
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Assigned Employees</th>
              <th>Updated At</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map(struct => {
              const isSys = struct.name === 'Standard Indian Corporate';
              return (
                <tr key={struct.id} style={{ opacity: struct.is_active ? 1 : 0.6 }}>
                  <td>
                    {struct.name}
                    {isSys && <Lock size={12} style={{ marginLeft: 6, color: 'var(--text-muted)' }} />}
                  </td>
                  <td>{struct.description || '-'}</td>
                  <td>{struct.is_active ? 'Active' : 'Archived'}</td>
                  <td>{struct.employee_count}</td>
                  <td>{new Date(struct.updated_at).toLocaleDateString()}</td>
                  <td className="text-right">
                    <div className="action-buttons" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openModal(struct)} title={isSys ? 'View' : 'Edit'}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDuplicate(struct.id)} title="Duplicate">
                        <Copy size={16} />
                      </button>
                      {!isSys && struct.is_active && struct.employee_count === 0 && (
                        <button className="btn-icon" onClick={() => handleDelete(struct)} title="Archive">
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Structure' : 'New Structure'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Name</label>
                  <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label>Description</label>
                  <input className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '400px' }}>
                {/* Left Panel: Available Components */}
                <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Available Components</div>
                  <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableComponents.filter(c => !selectedComponents.some(sc => sc.id === c.id)).map(c => (
                      <div key={c.id} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.code} • {c.type}</div>
                        </div>
                        <button className="btn-icon" onClick={() => addComponent(c)}><ArrowRight size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel: Selected Components */}
                <div style={{ flex: 2, border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Selected Components & Configuration</div>
                  <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedComponents.map((c, idx) => (
                      <div key={c.id} style={{ padding: '12px', border: '1px solid var(--primary)', borderRadius: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                          <button className="btn-icon" onClick={() => moveComponent(idx, 'UP')} disabled={idx === 0}><ArrowUp size={14} /></button>
                          <button className="btn-icon" onClick={() => moveComponent(idx, 'DOWN')} disabled={idx === selectedComponents.length - 1}><ArrowDown size={14} /></button>
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.name} <span style={{fontSize:'12px', color:'var(--text-muted)'}}>({c.code})</span></div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seq: {idx + 1}</div>
                          </div>
                          <div>
                            <select className="form-control" value={c.calculation_type || ''} onChange={e => updateSelectedComp(idx, 'calculation_type', e.target.value)} style={{ padding: '6px', fontSize: '12px' }}>
                              <option value="">Calc Type...</option>
                              <option value="PERCENTAGE_OF_CTC">PERCENTAGE_OF_CTC</option>
                              <option value="PERCENTAGE_OF_BASIC">PERCENTAGE_OF_BASIC</option>
                              <option value="PERCENTAGE_OF_GROSS">PERCENTAGE_OF_GROSS</option>
                              <option value="FLAT_AMOUNT">FLAT_AMOUNT</option>
                              <option value="REMAINDER_OF_CTC">REMAINDER_OF_CTC</option>
                            </select>
                          </div>
                          <div>
                            <input className="form-control" type="number" placeholder="Value" value={c.value} onChange={e => updateSelectedComp(idx, 'value', e.target.value)} style={{ padding: '6px', fontSize: '12px' }} />
                          </div>
                          <div>
                            <input className="form-control" type="number" placeholder="Max Lim" value={c.max_limit} onChange={e => updateSelectedComp(idx, 'max_limit', e.target.value)} style={{ padding: '6px', fontSize: '12px' }} />
                          </div>
                        </div>
                        <button className="btn-icon text-danger" onClick={() => removeComponent(c.id)} style={{ paddingTop: '8px' }}><X size={18} /></button>
                      </div>
                    ))}
                    {selectedComponents.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No components added yet.</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Structure</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ASSIGN MODAL */}
      {isAssignModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h3>Bulk Assign Structure</h3>
              <button className="btn-icon" onClick={() => setIsAssignModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Salary Structure</label>
                <select className="form-control" value={assignData.structureId} onChange={e => setAssignData({...assignData, structureId: e.target.value})}>
                  {structures.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label>Employee IDs (comma separated UUIDs)</label>
                <textarea className="form-control" rows={3} value={assignData.employeeIds} onChange={e => setAssignData({...assignData, employeeIds: e.target.value})} placeholder="0000-0000-0000, 1111-1111..."></textarea>
              </div>
              <div>
                <label>Effective From</label>
                <input type="date" className="form-control" value={assignData.effectiveFrom} onChange={e => setAssignData({...assignData, effectiveFrom: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
