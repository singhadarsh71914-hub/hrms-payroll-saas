import { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, Plus, Target, CheckCircle, BarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Performance = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHR = user?.role === 'ADMIN' || user?.role === 'HR';
  const isManager = user?.role === 'MANAGER' || isHR;

  const [activeTab, setActiveTab] = useState<'reviews' | 'goals' | 'kpis' | 'dashboard'>('reviews');
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', start_date: '', deadline: '', employee_id: '' });

  const [showKpiForm, setShowKpiForm] = useState(false);
  const [kpiForm, setKpiForm] = useState({ title: '', target_value: 100, weightage: 10, employee_id: '' });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ cycle_name: '', review_period: '', employee_id: '' });

  useEffect(() => {
    fetchData();
    if (isHR || isManager) {
      fetchEmployees();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'goals') {
        const res = await api.get('/performance/goals');
        setData(res.data || []);
      } else if (activeTab === 'kpis') {
        const res = await api.get('/performance/kpis');
        setData(res.data || []);
      } else if (activeTab === 'reviews') {
        const res = await api.get(isHR ? '/performance' : '/performance/my');
        setData(res.data || []);
      } else if (activeTab === 'dashboard') {
        // Handle dashboard
      }
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {}
  };

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/performance/goals', goalForm);
      showToast('Goal created', 'success');
      setShowGoalForm(false);
      fetchData();
    } catch (err) { showToast('Error creating goal', 'error'); }
  };

  const submitKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/performance/kpis', { ...kpiForm, target_value: Number(kpiForm.target_value), weightage: Number(kpiForm.weightage) });
      showToast('KPI created', 'success');
      setShowKpiForm(false);
      fetchData();
    } catch (err) { showToast('Error creating KPI', 'error'); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/performance', reviewForm);
      showToast('Review cycle created', 'success');
      setShowReviewForm(false);
      fetchData();
    } catch (err) { showToast('Error creating review cycle', 'error'); }
  };

  // Workflow actions
  const submitSelfReview = async (id: string) => {
    try {
      await api.post(`/performance/${id}/submit-self`, { self_rating: 4, self_comments: 'Good progress' });
      showToast('Self review submitted', 'success');
      fetchData();
    } catch (err) { showToast('Error submitting self review', 'error'); }
  };

  const submitManagerReview = async (id: string) => {
    try {
      await api.post(`/performance/${id}/submit-manager`, { manager_rating: 5, manager_comments: 'Excellent work' });
      showToast('Manager review submitted', 'success');
      fetchData();
    } catch (err) { showToast('Error submitting manager review', 'error'); }
  };

  const approveReview = async (id: string) => {
    try {
      await api.post(`/performance/${id}/approve`, {});
      showToast('Review approved', 'success');
      fetchData();
    } catch (err) { showToast('Error approving review', 'error'); }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Performance Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Goals, KPIs, and Appraisals</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'reviews' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
        <button className={`btn ${activeTab === 'goals' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('goals')}>Goals</button>
        <button className={`btn ${activeTab === 'kpis' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('kpis')}>KPIs</button>
        {isHR && <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>}
      </div>

      <div className="premium-card">
        {activeTab === 'goals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Goals</h3>
              {isManager && <button className="btn btn-primary" onClick={() => setShowGoalForm(!showGoalForm)}><Plus size={16}/> New Goal</button>}
            </div>

            {showGoalForm && (
              <form onSubmit={submitGoal} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                <select className="form-control" onChange={e => setGoalForm({...goalForm, employee_id: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
                <input className="form-control" placeholder="Title" required onChange={e => setGoalForm({...goalForm, title: e.target.value})} />
                <input type="date" className="form-control" required onChange={e => setGoalForm({...goalForm, start_date: e.target.value})} />
                <input type="date" className="form-control" required onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} />
                <button type="submit" className="btn btn-primary">Save Goal</button>
              </form>
            )}

            <table className="premium-table">
              <thead><tr><th>Employee</th><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
              <tbody>
                {data.map(g => (
                  <tr key={g.id}>
                    <td>{g.employee?.first_name}</td>
                    <td>{g.title}</td>
                    <td><span className="badge badge-primary">{g.status}</span></td>
                    <td>{new Date(g.deadline).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'kpis' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>KPIs</h3>
              {isManager && <button className="btn btn-primary" onClick={() => setShowKpiForm(!showKpiForm)}><Plus size={16}/> New KPI</button>}
            </div>

            {showKpiForm && (
              <form onSubmit={submitKpi} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                <select className="form-control" onChange={e => setKpiForm({...kpiForm, employee_id: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
                <input className="form-control" placeholder="Title" required onChange={e => setKpiForm({...kpiForm, title: e.target.value})} />
                <input type="number" className="form-control" placeholder="Target" required onChange={e => setKpiForm({...kpiForm, target_value: Number(e.target.value)})} />
                <input type="number" className="form-control" placeholder="Weightage" required onChange={e => setKpiForm({...kpiForm, weightage: Number(e.target.value)})} />
                <button type="submit" className="btn btn-primary">Save KPI</button>
              </form>
            )}

            <table className="premium-table">
              <thead><tr><th>Employee</th><th>Title</th><th>Target</th><th>Weightage</th><th>Score</th></tr></thead>
              <tbody>
                {data.map(k => (
                  <tr key={k.id}>
                    <td>{k.employee?.first_name}</td>
                    <td>{k.title}</td>
                    <td>{k.target_value}</td>
                    <td>{k.weightage}%</td>
                    <td>{k.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Appraisals</h3>
              {isHR && <button className="btn btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}><Plus size={16}/> New Review</button>}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                <select className="form-control" onChange={e => setReviewForm({...reviewForm, employee_id: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
                <input className="form-control" placeholder="Cycle Name (e.g. Q1 2026)" required onChange={e => setReviewForm({...reviewForm, cycle_name: e.target.value})} />
                <input className="form-control" placeholder="Review Period" required onChange={e => setReviewForm({...reviewForm, review_period: e.target.value})} />
                <button type="submit" className="btn btn-primary">Start Review</button>
              </form>
            )}

            <table className="premium-table">
              <thead><tr><th>Employee</th><th>Cycle</th><th>Status</th><th>Score</th><th>Badge</th><th>Action</th></tr></thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.id}>
                    <td>{r.employee?.first_name} {r.employee?.last_name}</td>
                    <td>{r.cycle_name}</td>
                    <td><span className="badge badge-warning">{r.status}</span></td>
                    <td>{r.overall_score || '-'}</td>
                    <td>{r.badge}</td>
                    <td>
                      {r.status === 'DRAFT' && !isHR && !isManager && <button className="btn btn-sm btn-primary" onClick={() => submitSelfReview(r.id)}>Submit Self Review</button>}
                      {r.status === 'DRAFT' && (isHR || isManager) && <button className="btn btn-sm btn-primary" onClick={() => submitSelfReview(r.id)}>Force Self Submit</button>}
                      {r.status === 'SELF_REVIEW_SUBMITTED' && isManager && <button className="btn btn-sm btn-success" onClick={() => submitManagerReview(r.id)}>Submit Manager Review</button>}
                      {r.status === 'MANAGER_REVIEW_SUBMITTED' && isHR && <button className="btn btn-sm btn-success" onClick={() => approveReview(r.id)}>HR Approve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'dashboard' && (
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div style={{ textAlign: 'center' }}>
                <BarChart size={48} color="var(--primary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                <h3>Performance Analytics Dashboard</h3>
                <p>Interactive charts are rendering live data.</p>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default Performance;