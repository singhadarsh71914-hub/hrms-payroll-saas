import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { 
  FileText, Download, Trash2, Search, Upload, FileSignature, X, 
  FileCheck, FileSearch, Filter, CloudUpload, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Documents = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ employee_id: '', document_type: '', document_name: '' });
  const [file, setFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => {
    fetchDocs();
    if (isHR) {
      fetchEmployees();
    }
  }, [isHR]);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(isHR ? '/documents' : '/documents/my');
      setDocs(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch documents", 'error');
    } finally {
      setIsLoading(false);
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

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await api.delete(`/documents/${docToDelete}`);
      showToast("Document deleted successfully", 'success');
      setDocToDelete(null);
      fetchDocs();
    } catch (err) {
      showToast("Failed to delete document", 'error');
      setDocToDelete(null);
    }
  };

  const handleCancel = () => {
    setIsUploadModalOpen(false);
    setFile(null);
    setUploadData({ employee_id: '', document_type: '', document_name: '' });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!uploadData.employee_id) return showToast("Employee selection is required", 'error');
    if (!uploadData.document_type) return showToast("Document type is required", 'error');
    if (!uploadData.document_name) return showToast("Display name is required", 'error');
    if (!file) return showToast("Please select a file to upload", 'error');

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employee_id', uploadData.employee_id);
    formData.append('document_type', uploadData.document_type);
    formData.append('document_name', uploadData.document_name);

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Document uploaded successfully", 'success');
      handleCancel(); // Close and reset
      fetchDocs();
    } catch (err) {
      showToast("Failed to upload document", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    const docId = doc.id;
    const documentName = doc.document_name;
    console.log('Downloading document:', docId, documentName);
    const downloadUrl = `documents/${docId}/download`;
    
    if (!docId) {
      return showToast("Document ID not found", 'error');
    }
    
    try {
      showToast("Preparing download...", 'info');
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });
      
      // Fix: Create blob with correct MIME type from server
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      
      // Fix: Extract filename from Content-Disposition header if available
      let finalFileName = documentName;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          finalFileName = filenameMatch[1];
        }
      } else {
        // Fallback: Use file_url extension if header is missing
        const ext = doc.file_url.split('.').pop();
        if (ext && !finalFileName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
          finalFileName = `${finalFileName}.${ext}`;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      showToast("Failed to download document", 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const filteredDocs = docs.filter(d => {
    const matchName = d.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      d.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType ? d.document_type === filterType : true;
    return matchName && matchType;
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={24} color="#ef4444" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileSignature size={24} color="#3b82f6" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <FileCheck size={24} color="#10b981" />;
    return <FileText size={24} color="var(--text-muted)" />;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.025em' }}>Document Vault</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Secure management of company records and employee dossiers</p>
        </div>
        {isHR && (
          <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)} style={{ boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', padding: '0.75rem 1.5rem' }}>
            <CloudUpload size={20} />
            Secure Upload
          </button>
        )}
      </div>

      <div className="premium-card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by document name or employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '1rem 1.5rem 1rem 3.5rem', 
                borderRadius: '12px', 
                border: '1.5px solid var(--border)', 
                background: 'var(--bg-page)', 
                color: 'white',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-page)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontWeight: 600, padding: '0.5rem' }}
            >
              <option value="" style={{ background: 'var(--bg-card)' }}>All Document Types</option>
              <option value="OFFER_LETTER" style={{ background: 'var(--bg-card)' }}>Offer Letter</option>
              <option value="ID_PROOF" style={{ background: 'var(--bg-card)' }}>ID Proof</option>
              <option value="ADDRESS_PROOF" style={{ background: 'var(--bg-card)' }}>Address Proof</option>
              <option value="PF_FORM" style={{ background: 'var(--bg-card)' }}>PF Form</option>
              <option value="FORM16" style={{ background: 'var(--bg-card)' }}>Form 16</option>
              <option value="OTHER" style={{ background: 'var(--bg-card)' }}>Other</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Decrypting vault files...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="premium-card" style={{ 
                padding: '1.5rem', 
                background: 'var(--bg-page)', 
                border: '1px solid var(--border)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '12px', 
                    background: 'rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {getFileIcon(doc.document_name)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleDownload(doc)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer' }} title="Download">
                      <Download size={18} />
                    </button>
                    {isHR && (
                      <button onClick={() => setDocToDelete(doc.id)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>{doc.document_name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--primary)', fontWeight: 700 }}>{doc.document_type.replace('_', ' ')}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                      {doc.employee?.first_name?.[0]}{doc.employee?.last_name?.[0]}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.employee?.first_name} {doc.employee?.last_name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 0' }}>
                 <FileSearch size={64} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                 <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Documents Found</h2>
                 <p style={{ color: 'var(--text-muted)' }}>We couldn't find any documents matching your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Upload Document</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Securely add a new file to the vault</p>
              </div>
              <button type="button" onClick={handleCancel} style={{ background: 'var(--bg-page)', borderRadius: '8px', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Employee Assignment *</label>
                  <select 
                    className="form-control" 
                    value={uploadData.employee_id} 
                    onChange={e => setUploadData({...uploadData, employee_id: e.target.value})}
                    required
                    style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', color: 'white', outline: 'none' }}
                  >
                    <option value="" style={{ background: 'var(--bg-card)' }}>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id} style={{ background: 'var(--bg-card)' }}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Document Type *</label>
                  <select 
                    className="form-control" 
                    value={uploadData.document_type} 
                    onChange={e => setUploadData({...uploadData, document_type: e.target.value})}
                    required
                    style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', color: 'white', outline: 'none' }}
                  >
                    <option value="" style={{ background: 'var(--bg-card)' }}>Select Type</option>
                    <option value="OFFER_LETTER" style={{ background: 'var(--bg-card)' }}>Offer Letter</option>
                    <option value="ID_PROOF" style={{ background: 'var(--bg-card)' }}>ID Proof</option>
                    <option value="ADDRESS_PROOF" style={{ background: 'var(--bg-card)' }}>Address Proof</option>
                    <option value="PF_FORM" style={{ background: 'var(--bg-card)' }}>PF Form</option>
                    <option value="FORM16" style={{ background: 'var(--bg-card)' }}>Form 16</option>
                    <option value="OTHER" style={{ background: 'var(--bg-card)' }}>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Display Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Passport Copy" 
                    value={uploadData.document_name} 
                    onChange={e => setUploadData({...uploadData, document_name: e.target.value})}
                    required
                    style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', color: 'white', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>File Selection *</label>
                  <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '2rem',
                      textAlign: 'center',
                      background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-page)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    
                    {file ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                         <CheckCircle2 size={32} color="#10b981" />
                         <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{file.name}</p>
                         <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <CloudUpload size={32} color="var(--primary)" />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>Drag & drop or click to browse</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>PDF, DOC, JPG, PNG (Max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  disabled={isUploading}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '8px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', borderRadius: '24px', padding: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <AlertCircle size={32} />
               </div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Purge Document?</h2>
               <p style={{ color: 'var(--text-muted)' }}>This will permanently remove the record and the associated file from our secure servers.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setDocToDelete(null)} style={{ flex: 1 }}>Abort</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', flex: 1 }} onClick={handleDelete}>Confirm Purge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;