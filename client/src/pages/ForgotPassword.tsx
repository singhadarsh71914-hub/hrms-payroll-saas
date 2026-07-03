import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      showToast('If an account exists, a reset link has been sent.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to request password reset', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-secondary"
            style={{ marginBottom: '24px', padding: '6px 12px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>

          <h2 style={{ marginBottom: '8px' }}>Reset Password</h2>
          
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and spam folder. The link will expire in 30 minutes.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Enter your registered work email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
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
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
