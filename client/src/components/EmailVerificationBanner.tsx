import React, { useState } from 'react';
import { Mail, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // If user is verified, or it's a superadmin, or they dismissed it for this session, hide.
  if (!user || user.email_verified || user.role === 'SUPERADMIN' || dismissed) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
      zIndex: 100,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: '200px' }}>
        <Mail size={20} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 500 }}>
          Please verify your email address to unlock full platform features (like Payroll and Documents).
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg, 16px)' }}>
        <button 
          onClick={() => navigate('/verify-email')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm, 8px)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          Verify Now <ArrowRight size={14} />
        </button>
        <button 
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex' }}
          aria-label="Dismiss banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
