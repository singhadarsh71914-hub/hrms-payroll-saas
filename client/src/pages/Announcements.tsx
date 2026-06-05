import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Megaphone, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Announcements = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', content: '', priority: 'NORMAL' });
  const [isLoading, setIsLoading] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);

  const isHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch announcements', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      return showToast("Please fill all required fields", 'error');
    }
    
    setIsLoading(true);
    try {
      if (formData.id) {
        await api.put(`/announcements/${formData.id}`, formData);
        showToast('Announcement updated successfully', 'success');
      } else {
        await api.post('/announcements', formData);
        showToast('Announcement posted successfully', 'success');
      }
      setShowCreate(false);
      setFormData({ id: '', title: '', content: '', priority: 'NORMAL' });
      fetchAnnouncements();
    } catch (err) {
      showToast('Failed to save announcement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (announcement: any) => {
    setFormData({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
    setShowCreate(true);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await api.delete(`/announcements/${announcementToDelete}`);
      showToast('Announcement deleted successfully', 'success');
      setAnnouncementToDelete(null);
      fetchAnnouncements();
    } catch (err) {
      showToast('Failed to delete announcement', 'error');
      setAnnouncementToDelete(null);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Notice Board</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Stay updated with organization news</p>
        </div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => {
            setFormData({ id: '', title: '', content: '', priority: 'NORMAL' });
            setShowCreate(true);
          }}>
            <Plus size={20} />
            Post Announcement
          </button>
        )}
      </div>

      {showCreate && isHR && (
        <div className="premium-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '800', margin: 0 }}>{formData.id ? 'Edit Announcement' : 'New Announcement'}</h3>
            <button className="icon-btn" onClick={() => setShowCreate(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Message Content</label>
              <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', minHeight: '100px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : (formData.id ? 'Update Announcement' : 'Post Announcement')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {announcements.map((a, i) => (
          <div key={a.id || i} className="premium-card" style={{ 
            borderTop: `6px solid ${a.priority === 'URGENT' ? '#ef4444' : a.priority === 'IMPORTANT' ? '#f59e0b' : '#3b82f6'}`,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span className={`badge ${a.priority === 'URGENT' ? 'badge-danger' : a.priority === 'IMPORTANT' ? 'badge-warning' : 'badge-primary'}`}>
                {a.priority}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
                {isHR && (
                  <>
                    <button onClick={() => handleEdit(a)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setAnnouncementToDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>{a.title}</h3>
            <p style={{ color: 'var(--text-main)', opacity: 0.9, lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap' }}>{a.content}</p>
          </div>
        ))}
      </div>
      {announcements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Megaphone size={48} color="var(--text-muted)" opacity={0.3} style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-main)', fontWeight: '700' }}>No Announcements</h3>
          <p style={{ color: 'var(--text-muted)' }}>The notice board is currently empty.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {announcementToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="icon-btn" onClick={() => setAnnouncementToDelete(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this announcement? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAnnouncementToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;