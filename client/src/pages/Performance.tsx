import { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, Plus, Star, Search, Calendar, ChevronRight, Edit2, Trash2, X, Target, Zap, Heart, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';

const Performance = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    employee_id: '',
    cycle_name: '',
    review_period: 'Annual 2026',
    goals_rating: 3,
    skills_rating: 3,
    attitude_rating: 3,
    leadership_rating: 3,
    remarks: ''
  });

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const isHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => {
    fetchReviews();
    if (isHR) {
      fetchEmployees();
    }
  }, [isHR]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(isHR ? '/performance' : '/performance/my');
      setReviews(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load performance reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.cycle_name) {
      return showToast("Please select an employee and enter cycle name", 'error');
    }
    try {
      if (formData.id) {
        await api.put(`/performance/${formData.id}`, formData);
        showToast('Review cycle updated successfully', 'success');
      } else {
        await api.post('/performance', formData);
        showToast('Review cycle created successfully', 'success');
      }
      setShowCreate(false);
      setFormData({
        id: '', employee_id: '', cycle_name: '', review_period: 'Annual 2026', goals_rating: 3, skills_rating: 3, attitude_rating: 3, leadership_rating: 3, remarks: ''
      });
      fetchReviews();
    } catch (err) {
      showToast(formData.id ? 'Failed to update review cycle' : 'Failed to create review cycle', 'error');
    }
  };

  const handleEdit = (review: any) => {
    setFormData({
      id: review.id,
      employee_id: review.employee_id,
      cycle_name: review.cycle_name,
      review_period: review.review_period,
      goals_rating: review.goals_rating,
      skills_rating: review.skills_rating,
      attitude_rating: review.attitude_rating,
      leadership_rating: review.leadership_rating,
      remarks: review.remarks || ''
    });
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await api.delete(`/performance/${reviewToDelete}`);
      showToast('Review deleted successfully', 'success');
      setReviewToDelete(null);
      fetchReviews();
    } catch (err) {
      showToast('Failed to delete review', 'error');
      setReviewToDelete(null);
    }
  };

  const getBadgeColor = (badge: string) => {
    const b = badge?.toLowerCase();
    if (b === 'excellent') return 'badge-success';
    if (b === 'good') return 'badge-primary';
    if (b === 'average') return 'badge-warning';
    return 'badge-danger';
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} fill={i < score ? "#f59e0b" : "transparent"} color={i < score ? "#f59e0b" : "var(--border)"} />
    ));
  };

  const StarSelector = ({ label, value, icon: Icon, onChange }: { label: string, value: number, icon: any, onChange: (v: number) => void }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Icon size={16} className="text-primary" />
        <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>{label}</label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Star 
              size={24} 
              fill={num <= value ? "#f59e0b" : "transparent"} 
              color={num <= value ? "#f59e0b" : "var(--border)"} 
            />
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontWeight: '800', color: 'var(--primary)', background: 'var(--bg-page)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
          {value}/5
        </span>
      </div>
    </div>
  );

  const filteredReviews = reviews.filter(r => 
    r.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.cycle_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <Skeleton width="300px" height="40px" />
          <Skeleton width="400px" height="20px" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <Skeleton height="120px" borderRadius="16px" />
         <Skeleton height="120px" borderRadius="16px" />
         <Skeleton height="120px" borderRadius="16px" />
         <Skeleton height="120px" borderRadius="16px" />
      </div>
      <Skeleton height="400px" borderRadius="16px" />
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Reviews</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track and manage employee appraisals</p>
        </div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              id: '', employee_id: '', cycle_name: '', review_period: 'Annual 2026', goals_rating: 3, skills_rating: 3, attitude_rating: 3, leadership_rating: 3, remarks: ''
            });
            setShowCreate(true);
          }}>
            <Plus size={20} />
            Create Review Cycle
          </button>
        )}
      </div>

      {isHR && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="premium-card" style={{ textAlign: 'center', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Excellent</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981' }}>{reviews.filter(r => r.badge?.toLowerCase() === 'excellent').length}</div>
          </div>
          <div className="premium-card" style={{ textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Good</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6' }}>{reviews.filter(r => r.badge?.toLowerCase() === 'good').length}</div>
          </div>
          <div className="premium-card" style={{ textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b' }}>{reviews.filter(r => r.badge?.toLowerCase() === 'average').length}</div>
          </div>
          <div className="premium-card" style={{ textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Needs Improvement</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444' }}>{reviews.filter(r => r.badge?.toLowerCase() === 'needs improvement').length}</div>
          </div>
        </div>
      )}

      <div className="premium-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search employee or cycle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg)', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Review Cycle</th>
                <th>Period</th>
                <th>Overall Score</th>
                <th>Badge</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r, i) => (
                <tr key={r.id || i}>
                  {isHR && (
                    <td>
                      <div style={{ fontWeight: '700' }}>{r.employee?.first_name} {r.employee?.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.employee?.employee_code}</div>
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} color="var(--primary)" />
                      <span style={{ fontWeight: '600' }}>{r.cycle_name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: '600' }}>{r.review_period}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)' }}>
                        {Number(r.overall_score).toFixed(1)}
                      </div>
                      <div style={{ display: 'flex' }}>{renderStars(Math.round(r.overall_score))}</div>
                    </div>
                  </td>
                  <td><span className={`badge ${getBadgeColor(r.badge)}`}>{r.badge}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => setSelectedReview(r)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="View Details">
                        <ChevronRight size={16} />
                      </button>
                      {isHR && (
                        <>
                          <button className="btn btn-secondary" onClick={() => handleEdit(r)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" onClick={() => setReviewToDelete(r.id)} style={{ padding: '0.4rem', borderRadius: '6px' }} title="Delete">
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                       <Award size={48} className="empty-state-icon" />
                       <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No records found</h3>
                       <p style={{ color: 'var(--text-secondary)' }}>No performance records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!reviewToDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this performance review? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setReviewToDelete(null)}
        confirmText="Delete"
        isDestructive={true}
      />

      {/* Create/Edit Review Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>{formData.id ? 'Update Review Cycle' : 'Create Performance Review'}</h2>
              <button className="icon-btn" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Select Employee</label>
                    <select 
                      className="form-control" 
                      value={formData.employee_id} 
                      onChange={e => setFormData({...formData, employee_id: e.target.value})}
                      required
                      disabled={!!formData.id}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Cycle Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Q1 Performance Appraisal" 
                      value={formData.cycle_name} 
                      onChange={e => setFormData({...formData, cycle_name: e.target.value})}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Review Period</label>
                    <select 
                      className="form-control" 
                      value={formData.review_period} 
                      onChange={e => setFormData({...formData, review_period: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                    >
                      <option value="Annual 2026">Annual 2026</option>
                      <option value="H1 2026">H1 2026 (Jan-Jun)</option>
                      <option value="H2 2026">H2 2026 (Jul-Dec)</option>
                      <option value="Q1 2026">Q1 2026</option>
                      <option value="Q2 2026">Q2 2026</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Overall Remarks</label>
                    <textarea 
                      className="form-control" 
                      placeholder="Enter detailed feedback..." 
                      value={formData.remarks} 
                      onChange={e => setFormData({...formData, remarks: e.target.value})}
                      rows={4}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-page)', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: '800' }}>Skill Ratings</h3>
                  
                  <StarSelector 
                    label="Goal Achievement" 
                    icon={Target}
                    value={formData.goals_rating} 
                    onChange={v => setFormData({...formData, goals_rating: v})} 
                  />
                  <StarSelector 
                    label="Technical Skills" 
                    icon={Zap}
                    value={formData.skills_rating} 
                    onChange={v => setFormData({...formData, skills_rating: v})} 
                  />
                  <StarSelector 
                    label="Work Attitude" 
                    icon={Heart}
                    value={formData.attitude_rating} 
                    onChange={v => setFormData({...formData, attitude_rating: v})} 
                  />
                  <StarSelector 
                    label="Leadership / Teamwork" 
                    icon={Users}
                    value={formData.leadership_rating} 
                    onChange={v => setFormData({...formData, leadership_rating: v})} 
                  />

                  <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', textAlign: 'center' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Calculated Score</div>
                     <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>
                        {((formData.goals_rating + formData.skills_rating + formData.attitude_rating + formData.leadership_rating) / 4).toFixed(1)}
                     </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Save Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedReview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: '0' }}>
            <div style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', color: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>{selectedReview.cycle_name}</h2>
                  <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontWeight: '600' }}>{selectedReview.review_period}</p>
                </div>
                <button className="icon-btn" onClick={() => setSelectedReview(null)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}><X size={20} /></button>
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                 <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: '900', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                    {selectedReview.overall_score}
                 </div>
                 <div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                       {Array.from({ length: 5 }).map((_, i) => (
                         <Star key={i} size={18} fill={i < Math.round(selectedReview.overall_score) ? "#fbbf24" : "transparent"} color={i < Math.round(selectedReview.overall_score) ? "#fbbf24" : "rgba(255,255,255,0.3)"} />
                       ))}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>{selectedReview.badge}</span>
                 </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              {selectedReview.employee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-page)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                    {selectedReview.employee.first_name?.[0] || ''}{selectedReview.employee.last_name?.[0] || ''}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800' }}>{selectedReview.employee.first_name} {selectedReview.employee.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedReview.employee.employee_code} • {selectedReview.employee.work_email}</div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                   <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Metric Breakdown</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Goals:</span> {renderStars(selectedReview.goals_rating)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Skills:</span> {renderStars(selectedReview.skills_rating)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Attitude:</span> {renderStars(selectedReview.attitude_rating)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Leadership:</span> {renderStars(selectedReview.leadership_rating)}</div>
                   </div>
                </div>
                <div>
                   <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Manager Feedback</div>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{selectedReview.remarks || 'No detailed remarks provided for this review cycle.'}"
                   </p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReview(null)}>Close Assessment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;