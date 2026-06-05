import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { holidayService } from '../services/holiday.service';
import { Palmtree, Plus, Trash2, Calendar, MapPin, Building2, Download } from 'lucide-react';

const Holidays: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'NATIONAL'
  });
  const [submitting, setSubmitting] = useState(false);

  const isHR = user?.role === 'HR' || user?.role === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await holidayService.getHolidays(selectedYear);
      setHolidays(data);
    } catch (err) {
      console.error('Failed to fetch holidays', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await holidayService.addHoliday(formData);
      setShowAdd(false);
      setFormData({ name: '', date: '', type: 'NATIONAL' });
      fetchData();
    } catch (err) {
      showToast('Failed to add holiday', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await holidayService.deleteHoliday(id);
      fetchData();
      showToast('Holiday deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete holiday', 'error');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await holidayService.seedHolidays(selectedYear);
      fetchData();
      showToast('Holidays seeded successfully', 'success');
    } catch (err) {
      showToast('Failed to seed holidays', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NATIONAL': return '#16a34a';
      case 'REGIONAL': return '#3b82f6';
      case 'COMPANY': return '#f59e0b';
      default: return 'var(--text-muted)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NATIONAL': return <Calendar size={14} />;
      case 'REGIONAL': return <MapPin size={14} />;
      case 'COMPANY': return <Building2 size={14} />;
      default: return null;
    }
  };

  if (loading && holidays.length === 0) return <div>Loading holidays...</div>;

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Palmtree size={32} className="text-primary" />
          <h1>Holiday Calendar</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {isHR && (
            <>
              <button className="btn btn-outline" onClick={handleSeed} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={18} />
                Seed 2026 Holidays
              </button>
              <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                Add Holiday
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showAdd ? '1fr 350px' : '1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Holiday Name</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  {isHR && <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(h.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{h.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: getTypeColor(h.type),
                        background: 'var(--bg-light)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px'
                      }}>
                        {getTypeIcon(h.type)}
                        {h.type}
                      </div>
                    </td>
                    {isHR && (
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(h.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {holidays.length === 0 && (
                  <tr>
                    <td colSpan={isHR ? 4 : 3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No holidays found for this year
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAdd && (
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add New Holiday</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Holiday Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                  placeholder="e.g. Diwali"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                  <option value="COMPANY">Company Holiday</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Holiday'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: '0.5rem' }} 
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Holidays;
