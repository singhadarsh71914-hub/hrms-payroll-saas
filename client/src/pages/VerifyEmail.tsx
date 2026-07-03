import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status');
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        try {
          // The backend returns a redirect, but axios follows it by default.
          // To be safe, if we get here we can call the endpoint.
          // Wait, if backend redirects to frontend, axios gets HTML.
          // Let's use a standard fetch or let it redirect?
          // Actually, if backend is GET /api/auth/verify-email?token=...
          // We can just window.location.href to the backend!
          window.location.href = `http://localhost:3000/api/auth/verify-email?token=${token}`;
        } catch (err) {
          console.error(err);
        }
      };
      verifyToken();
    }
  }, [token]);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/resend-verification');
      alert(response.data.message || 'Email sent successfully.');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to resend verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div className="auth-branding">
          <h1>HRMS & Payroll Platform</h1>
          <p>Secure email verification.</p>
        </div>
      </div>
      <div className="split-right">
        <div className="auth-card" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
          
          {status === 'success' && (
            <>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '16px' }}>Email Verified!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Thank you for verifying your email address. You now have full access to the platform.
              </p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '16px' }}>Verification Failed</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                The verification link is invalid or has expired. Please request a new link.
              </p>
              {error && <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}
              {user ? (
                <button 
                  onClick={handleResend} 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? <Loader size={18} className="spin" /> : 'Resend Link'}
                </button>
              ) : (
                <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Login to Request Link
                </button>
              )}
            </>
          )}

          {!status && user && !user.email_verified && (
            <>
              <Mail size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '16px' }}>Check Your Inbox</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                We've sent a verification link to <strong>{user.email}</strong>. 
                Please verify your email to unlock all features.
              </p>
              {error && <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</div>}
              <button 
                onClick={handleResend} 
                className="btn btn-secondary" 
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? <Loader size={18} className="spin" /> : 'Resend Verification Email'}
              </button>
            </>
          )}

          {!status && (!user || user.email_verified) && (
            <>
               <h2 style={{ marginBottom: '16px' }}>Invalid Request</h2>
               <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Go to Dashboard
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
