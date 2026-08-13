import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, LogOut, CreditCard, Calendar, Clock, Activity,
  Palmtree, IndianRupee, FileText, Menu, Building2,
  Award, Wallet, Receipt, Bell, ChevronRight, Key, MapPin, Shield
} from 'lucide-react';
import api from '../services/api';
import { GlobalSearch } from './GlobalSearch';
import { useNotification } from '../context/NotificationContext';
import EmailVerificationBanner from './EmailVerificationBanner';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [collapsed, setCollapsed] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingLoans, setPendingLoans] = useState(0);

  // Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { notifications, unreadCount, markAllAsRead: handleMarkAllRead, markAsRead: handleMarkRead } = useNotification();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'HR' || user?.role === 'ADMIN') {
      api.get('/analytics/overview').then(res => {
        setPendingLeaves(res.data.pendingLeaves || 0);
        setPendingLoans(res.data.pendingLoans || 0);
      }).catch(() => {});
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = new Date().valueOf() - new Date(dateString).valueOf();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const NavGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: '1.5rem' }}>
      {!collapsed && <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '12px' }}>{title}</div>}
      {children}
    </div>
  );

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.includes('employee')) return 'Employees';
    if (path.includes('payroll')) return 'Payroll';
    if (path.includes('leave')) return 'Leave Management';
    if (path.includes('attendance/intelligence')) return 'Command Center';
    if (path.includes('attendance')) return 'Attendance';
    if (path.includes('loan')) return 'Loans';
    if (path.includes('tax')) return 'Tax & Form 16';
    if (path.includes('document')) return 'Documents';
    if (path.includes('performance')) return 'Performance';
    if (path.includes('reimbursement')) return 'Reimbursements';
    if (path.includes('announcement')) return 'Announcements';
    if (path.includes('holiday')) return 'Holidays';
    return 'Workspace';
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', padding: '24px 16px 0' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.company?.name?.charAt(0) || 'H'}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sidebar-text)', margin: 0, letterSpacing: '-0.5px' }}>{user?.company?.name || 'HRMS'}</h2>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            {collapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {user?.role === 'EMPLOYEE' ? (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> {!collapsed && <span className="nav-text">Dashboard</span>}
              </NavLink>
              <NavLink to="/my-leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Calendar size={18} /> {!collapsed && <span className="nav-text">My Leaves</span>}
              </NavLink>
              <NavLink to="/my-payslips" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={18} /> {!collapsed && <span className="nav-text">Payslips</span>}
              </NavLink>
              <NavLink to="/my-loans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <IndianRupee size={18} /> {!collapsed && <span className="nav-text">My Loans</span>}
              </NavLink>
              <NavLink to="/my-tax" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Receipt size={18} /> {!collapsed && <span className="nav-text">Tax & Form 16</span>}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginBottom: '0.5rem' }}>
                <LayoutDashboard size={18} /> {!collapsed && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginBottom: '2rem' }}>
                <Activity size={18} /> {!collapsed && <span>Analytics</span>}
              </NavLink>

              <NavGroup title="HR Core">
                <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={18} /> {!collapsed && <span>Employees</span>}
                </NavLink>
                <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Clock size={18} /> {!collapsed && <span>Attendance</span>}
                </NavLink>
                <NavLink to="/attendance/intelligence" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MapPin size={18} /> {!collapsed && <span>Command Center</span>}
                </NavLink>
                <NavLink to="/leave" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Calendar size={18} /> {!collapsed && <span style={{ flex: 1 }}>Leave</span>}
                  {!collapsed && pendingLeaves > 0 && <span style={{ background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{pendingLeaves}</span>}
                </NavLink>
                <NavLink to="/performance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Award size={18} /> {!collapsed && <span>Performance</span>}
                </NavLink>
              </NavGroup>

              <NavGroup title="Finance">
                <NavLink to="/payroll" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <CreditCard size={18} /> {!collapsed && <span>Payroll</span>}
                </NavLink>
                <NavLink to="/salary-components" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <CreditCard size={18} /> {!collapsed && <span>Salary Components</span>}
                </NavLink>
                <NavLink to="/salary-structures" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Building2 size={18} /> {!collapsed && <span>Salary Structures</span>}
                </NavLink>
                <NavLink to="/loans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Wallet size={18} /> {!collapsed && <span style={{ flex: 1 }}>Loans</span>}
                  {!collapsed && pendingLoans > 0 && <span style={{ background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{pendingLoans}</span>}
                </NavLink>
                <NavLink to="/reimbursements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <IndianRupee size={18} /> {!collapsed && <span>Reimbursements</span>}
                </NavLink>
              </NavGroup>

              <NavGroup title="Compliance & Org">
                <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <FileText size={18} /> {!collapsed && <span>Documents</span>}
                </NavLink>
                <NavLink to="/tax" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Receipt size={18} /> {!collapsed && <span>Tax & Form 16</span>}
                </NavLink>
                <NavLink to="/holidays" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Palmtree size={18} /> {!collapsed && <span>Holidays</span>}
                </NavLink>
                <NavLink to="/announcements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Bell size={18} /> {!collapsed && <span>Announcements</span>}
                </NavLink>
                <NavLink to="/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Clock size={18} /> {!collapsed && <span>Audit Logs</span>}
                </NavLink>
                <NavLink to="/statutory-config" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Shield size={18} /> {!collapsed && <span>Statutory Config</span>}
                </NavLink>
                <NavLink to="/company-settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Building2 size={18} /> {!collapsed && <span>Company Settings</span>}
                </NavLink>
              </NavGroup>
            </>
          )}
        </nav>
      </aside>
      
      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <EmailVerificationBanner />
        
        {/* TOP NAVBAR */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
             <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>
               <span className="hide-on-mobile">HRMS <span style={{ color: 'var(--text-muted)' }}>/</span> </span><span style={{ color: 'var(--primary)' }}>{getPageTitle()}</span>
             </span>
             
             {/* Navbar center — search */}
             <div className="hide-on-mobile" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
               <GlobalSearch />
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

            {/* NOTIFICATIONS */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                data-testid="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }} />
                )}
              </button>
              {showNotifications && (
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '320px', zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                   <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     Notifications {unreadCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{unreadCount}</span>}
                     {unreadCount > 0 && (
                       <span data-testid="mark-all-read" onClick={handleMarkAllRead} style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }}>Mark all read</span>
                     )}
                   </div>
                   <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                     {notifications.length === 0 ? (
                       <div className="empty-state" style={{ padding: '32px 16px', border: 'none', background: 'transparent' }}>
                          <Bell size={32} className="empty-state-icon" style={{ opacity: 0.5, marginBottom: '12px' }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>You're all caught up!</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Notifications will appear here when there's an update.</p>
                       </div>
                     ) : (
                       notifications.map((n) => (
                         <div 
                           key={n.id} 
                           onClick={() => handleMarkRead(n.id, n.is_read)}
                           className="dropdown-item" 
                           style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(var(--primary-rgb), 0.05)' }}
                         >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <div style={{ fontWeight: n.is_read ? 500 : 600, fontSize: '13px', color: n.is_read ? 'var(--text-primary)' : 'var(--primary)' }}>{n.title}</div>
                             {!n.is_read && <span style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', marginTop: '6px' }} />}
                           </div>
                           <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{n.message}</div>
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{formatRelativeTime(n.created_at)}</div>
                         </div>
                       ))
                     )}
                   </div>
                </div>
              )}
            </div>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
            
            {/* PROFILE */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div 
                data-testid="profile-dropdown"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}
                className="profile-trigger"
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                  {user?.first_name?.charAt(0) || 'U'}
                </div>
              </div>
              
              {showProfileMenu && (
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', zIndex: 200 }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.first_name || 'User'} {user?.last_name || 'Profile'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{user?.email}</div>
                  </div>
                  <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    Profile
                  </button>
                  <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    Settings
                  </button>
                  <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    <Key size={14} /> Change Password
                  </button>
                  <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    Company Settings
                  </button>
                  <button className="dropdown-item" onClick={() => { throw new Error("Sentry Frontend Test"); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    Test Sentry (Frontend)
                  </button>
                  <button className="dropdown-item" onClick={() => { api.get('/debug-sentry').catch(()=>console.log('Backend test sent')); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                    Test Sentry (Backend)
                  </button>
                  <button data-testid="logout-btn" className="dropdown-item" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 500, fontSize: '13px' }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

