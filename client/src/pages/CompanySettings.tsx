import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Save, Building2, Briefcase, Hash } from 'lucide-react';
import { getCompanySettings, updateCompanySettings } from '../services/company.service';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/Skeleton';

export default function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>({
    name: '',
    trade_name: '',
    pan: '',
    tan: '',
    pf_registration_no: '',
    esi_registration_no: '',
    pt_registration_no: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    financial_year_start: 4
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getCompanySettings();
        if (data) {
          setCompany(data);
      }
    } catch (err) {
      toast.error('Failed to load company configuration');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanySettings(company);
      toast.success('Company settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  if (error) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Failed to load data</h3>
          <p>Could not retrieve company configuration from the server.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton width="200px" height="32px" style={{ marginBottom: '16px' }} />
        <Skeleton width="100%" height="400px" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Manage global company configurations and registrations</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '900px' }}>
        
        {/* Basic Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card"
        >
          <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>General Information</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Basic company profile and addresses</p>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Legal Name</label>
                <input type="text" name="name" value={company.name || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Trade Name (Doing Business As)</label>
                <input type="text" name="trade_name" value={company.trade_name || ''} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Registered Address</label>
                <input type="text" name="address" value={company.address || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={company.city || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" name="state" value={company.state || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pincode / ZIP</label>
                <input type="text" name="pincode" value={company.pincode || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Registrations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card"
        >
          <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
              <Hash size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Registration Numbers</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Tax and statutory compliance registrations</p>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>PAN (Permanent Account Number)</label>
                <input type="text" name="pan" value={company.pan || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>TAN (Tax Deduction Account Number)</label>
                <input type="text" name="tan" value={company.tan || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>PF Registration No.</label>
                <input type="text" name="pf_registration_no" value={company.pf_registration_no || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>ESI Registration No.</label>
                <input type="text" name="esi_registration_no" value={company.esi_registration_no || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Geofencing Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card"
        >
          <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>Geofencing & Locations</h2><span className="badge badge-error" style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>DISABLED</span></div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Migration Notice for Attendance Tracking</p>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: 'var(--text-primary)' }}>Feature Flag: Geofencing Granularity</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Global company-wide geofencing has been retired. To support multi-office organizations, 
                geofencing coordinates and allowed radii will be configured at the <strong>Location/Department</strong> level 
                in future updates. For now, GPS coordinates are informational only and strictly not enforced. 
                by geofencing radii.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}




