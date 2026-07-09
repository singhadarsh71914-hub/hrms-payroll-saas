import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Mail, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login({ email, password });
      setUser(data.user);
      navigate('/');
    } catch (err: any) {
      const status = err.response?.status;
      const backendMessage = err.backendMessage || err.response?.data?.message || err.response?.data?.error;

      if (status === 401) {
        setError('Invalid credentials');
      } else if (status === 403) {
        setError(backendMessage || 'Access denied');
      } else if (status === 429) {
        setError(backendMessage || 'Too many login attempts. Please try again in 15 minutes.');
      } else if (status >= 500) {
        setError('A server error occurred. Please try again later.');
      } else {
        setError(backendMessage || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
            The modern standard for HR management.
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '48px' }}>
            Empower your team with a complete, integrated platform for payroll, performance, and talent management. Built for speed and clarity.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #0f172a', zIndex: 3 }}></div>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a', marginLeft: '-12px', zIndex: 2 }}></div>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', border: '2px solid #0f172a', marginLeft: '-12px', zIndex: 1 }}></div>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>
              Trusted by 10,000+ forward-thinking teams.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="split-right">
        <div style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>Enter your credentials to access your workspace</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@company.com"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: '600' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                <input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
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
                <>Sign in <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Don't have a workspace? <Link to="/register" style={{ fontWeight: '600' }}>Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;