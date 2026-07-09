import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status');
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          window.location.href = `${baseUrl}/auth/verify-email?token=${token}`;
        } catch (err) {
          console.error(err);
        }
      };
      verifyToken();
    }
  }, [token]);

  const handleResend = async () => {
    if (!navigator.onLine) {
      setError('You are offline. Please check your network connection.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/resend-verification');
      setSuccessMsg(response.data.message || 'Email sent successfully.');
      setCountdown(60);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(err.response?.data?.message || 'Too many requests. Please try again later.');
        setCountdown(60);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to resend verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openGmail = () => {
    window.open('https://mail.google.com', '_blank');
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
              {successMsg && <div style={{ color: 'var(--success)', marginBottom: '16px' }}>{successMsg}</div>}
              {user ? (
                <button 
                  onClick={handleResend} 
                  className="btn btn-primary" 
                  disabled={loading || countdown > 0}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? <Loader size={18} className="spin" /> : (countdown > 0 ? `Resend available in ${countdown}s` : 'Resend Link')}
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
              {successMsg && <div style={{ color: 'var(--success)', marginBottom: '16px' }}>{successMsg}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={openGmail} 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Open Gmail <ExternalLink size={16} style={{ marginLeft: '8px' }} />
                </button>
                <button 
                  onClick={handleResend} 
                  className="btn btn-secondary" 
                  disabled={loading || countdown > 0}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? <Loader size={18} className="spin" /> : (countdown > 0 ? `Resend available in ${countdown}s` : 'Resend Verification Email')}
                </button>
              </div>
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
