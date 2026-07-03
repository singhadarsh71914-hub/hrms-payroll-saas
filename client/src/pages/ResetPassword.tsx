import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      showToast('Invalid or missing reset token', 'error');
    }
  }, [token, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showToast('Missing reset token. Please request a new link.', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      showToast('Password reset successful', 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to reset password. The link may have expired.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="split-layout">
        <div className="split-left"></div>
        <div className="split-right">
          <div className="auth-card" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
            <h2>Invalid Request</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              We couldn't find a valid reset token in your link. It may be broken or expired.
            </p>
            <button onClick={() => navigate('/forgot-password')} className="btn btn-primary">
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="auth-branding">
          <h1>HRMS & Payroll Platform</h1>
          <p>Enterprise-grade security for your workforce.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="auth-card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
          
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '16px' }}>Password Reset Complete</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Your password has been successfully updated. All active sessions have been securely signed out.
              </p>
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ marginBottom: '8px' }}>Create New Password</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Please enter a strong password. It must be at least 8 characters long.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '40px' }}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '15px', marginTop: '16px' }}
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
