import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth.service';
import { LayoutDashboard, Mail, Lock, Building, User, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="split-layout">
      {/* LEFT - Graphic / Illustration */}
      <div className="split-left">
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '64px', height: '64px', background: 'white', borderRadius: '16px', color: '#0f172a',
            marginBottom: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <LayoutDashboard size={32} />
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
            Transform your organization today.
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '48px' }}>
            Set up your workspace in minutes. Give your team the ultimate experience in payroll, compliance, and performance management.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #0f172a', zIndex: 3 }}></div>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a', marginLeft: '-12px', zIndex: 2 }}></div>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', border: '2px solid #0f172a', marginLeft: '-12px', zIndex: 1 }}></div>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>
              Join 10,000+ modern enterprises.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="split-right">
        <div style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Create workspace</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>Let's get your company set up.</p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="text" 
                  name="companyName"
                  value={formData.companyName} 
                  onChange={handleChange} 
                  required 
                  placeholder="Acme Corp Ltd."
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>First Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName} 
                    onChange={handleChange} 
                    required 
                    placeholder="John"
                    style={{ paddingLeft: '44px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Last Name</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName} 
                  onChange={handleChange} 
                  required 
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="admin@acmecorp.com"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600', justifyContent: 'center', marginTop: '8px' }} 
              disabled={loading}
            >
              {loading ? (
                <div style={{ width: '20px', height: '20px', border: '3px solid white', borderRightColor: 'transparent', borderRadius: '50%', animation: 'shimmer 1s linear infinite' }} />
              ) : (
                <>Create Workspace <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
