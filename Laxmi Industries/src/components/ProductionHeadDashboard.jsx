import React, { useState, useEffect } from 'react';
import './CommonStyles.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductionDashboard = ({ session, activeMenu, setActiveMenu }) => {
  const [workers, setWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    department: '',
    designation: '',
    category: '',
    rate: 0,
    remarks: ''
  });

  const [stats, setStats] = useState({
    totalRegistered: 0,
    inProcess: 0,
    finalized: 0,
    rejectedByProduction: 0,
    pendingProduction: 0,
    pendingHR: 0,
    pendingCEO: 0
  });

  const showToast = (msg, isError = false) => {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${isError ? '#dc2626' : '#1e3a8a'};color:white;padding:12px 20px;border-radius:8px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const departmentList = [
    "-- Select --",
    "Accounts", "Data Entry Operator", "Development", "Drilling & Tapping & Eicher",
    "Executive Assistant", "Firewall", "Floore Pannel", "Grinding Section", "HR",
    "Inspection & Packing-K2", "Inspection & Packing-Regular",
    "Laser Cut Section", "Logistics Driver & Helper", "Maintenance", "Maintenance Engineer",
    "Management Information System (MIS)", "Production", "Plant Head", "Quality Head", 
    "Tool Room", "Welding Section", "Priming Section", "Powder Coating", "Phospheting", 
    "Press Section", "Shearing"
  ];

  const designationList = [
    "-- Select --", "Worker", "Helper", "Operator", "Supervisor", "Welder", "Painter",
    "Packing Helper", "Fitter", "Electrician", "Mechanic", "Driver", "Office Staff",
    "Manager", "Engineer", "Sr. Engineer", "Team Lead"
  ];

  const categoryList = ["-- Select --", "Contractual", "Temporary", "Daily Wages", "Permanent"];

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/workers/all`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const allWorkersData = data.map(w => ({
          ...w,
          id: w._id,
          _id: w._id
        }));
        setAllWorkers(allWorkersData);
        
        // Workers pending production review (status = pending_contractor or pending_production)
        const pendingWorkers = allWorkersData.filter(w => 
          w.status === 'pending_contractor' || w.status === 'pending_production'
        );
        setWorkers(pendingWorkers);
        
        setStats({
          totalRegistered: allWorkersData.length,
          inProcess: allWorkersData.filter(w => w.status !== 'finalized' && w.status !== 'rejected').length,
          finalized: allWorkersData.filter(w => w.status === 'finalized').length,
          rejectedByProduction: allWorkersData.filter(w => w.status === 'rejected').length,
          pendingProduction: allWorkersData.filter(w => w.status === 'pending_contractor' || w.status === 'pending_production').length,
          pendingHR: allWorkersData.filter(w => w.status === 'pending_hr').length,
          pendingCEO: allWorkersData.filter(w => w.status === 'pending_ceo').length
        });
      } else {
        setWorkers([]);
        setAllWorkers([]);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setWorkers([]);
      setAllWorkers([]);
      showToast('Error loading workers', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = (worker) => {
    setSelectedWorker(worker);
    setReviewData({
      department: worker.department || '',
      designation: worker.designation || '',
      category: worker.category || '',
      rate: worker.dailyRate || 500,
      remarks: ''
    });
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedWorker) return;
    
    if (!reviewData.department || reviewData.department === "-- Select --") {
      showToast('❌ Please select a department', true);
      return;
    }
    if (!reviewData.designation || reviewData.designation === "-- Select --") {
      showToast('❌ Please select a designation', true);
      return;
    }
    if (!reviewData.category || reviewData.category === "-- Select --") {
      showToast('❌ Please select a category', true);
      return;
    }
    if (!reviewData.rate || reviewData.rate <= 0) {
      showToast('❌ Please enter a valid daily rate', true);
      return;
    }
    
    setLoading(true);
    try {
      const monthlySalary = reviewData.rate * 26;
      
      const response = await fetch(`${API_BASE_URL}/workers/approve/production/${selectedWorker._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      console.log("Approve response:", result);
      
      if (result._id || result.success) {
        showToast(`✅ ${selectedWorker.fullName} sent to CEO for approval`);
        setShowReviewModal(false);
        fetchWorkers();
      } else {
        showToast(`❌ Approval failed: ${result.error}`, true);
      }
    } catch (err) {
      console.error('Error approving worker:', err);
      showToast("Error approving worker", true);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'pending_list', label: 'Pending List', icon: 'clock', badge: workers.length },
    { id: 'logout', label: 'Logout', icon: 'sign-out-alt' }
  ];

  const handleMenuClick = (id) => {
    if (id === 'logout') {
      localStorage.removeItem('laxmi_session');
      window.location.reload();
      return;
    }
    setActiveMenu(id);
  };

  const getStageBadge = (status) => {
    switch(status) {
      case 'pending_contractor': return <span className="stage-badge warning">Pending Contractor</span>;
      case 'pending_production': return <span className="stage-badge production">Pending Production</span>;
      case 'pending_ceo': return <span className="stage-badge ceo">Pending CEO</span>;
      case 'pending_hr': return <span className="stage-badge hr">Pending HR</span>;
      case 'finalized': return <span className="stage-badge finalized">Finalized</span>;
      default: return <span className="stage-badge">{status || 'Pending'}</span>;
    }
  };

  const getFilteredWorkersByTab = () => {
    if (activeTab === 'all') return allWorkers;
    if (activeTab === 'production') return allWorkers.filter(w => w.status === 'pending_contractor' || w.status === 'pending_production');
    if (activeTab === 'ceo') return allWorkers.filter(w => w.status === 'pending_ceo');
    if (activeTab === 'hr') return allWorkers.filter(w => w.status === 'pending_hr');
    if (activeTab === 'finalized') return allWorkers.filter(w => w.status === 'finalized');
    return allWorkers;
  };

  const displayWorkers = getFilteredWorkersByTab();

  const StatCard = ({ title, value, icon, color, filterTab }) => (
    <div 
      className="stat-card" 
      style={{ borderLeftColor: color, cursor: 'pointer' }} 
      onClick={() => { setActiveTab(filterTab); setActiveMenu('dashboard'); }}
    >
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <i className={`fas fa-${icon}`} style={{ color }}></i>
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  // Pending List View
  if (activeMenu === 'pending_list') {
    const filteredWorkers = workers.filter(w =>
      w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="dashboard-layout">
        <div className="side-menu">
          <div className="menu-header">
            <i className="fas fa-industry"></i>
            <div>
              <h3>LAXMI CONTRACTOR</h3>
              <p>Production Head Portal</p>
              <small>{session.userName}</small>
            </div>
          </div>
          {menuItems.map(item => (
            <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
              <i className={`fas fa-${item.icon}`}></i>
              <span>{item.label}</span>
              {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
            </div>
          ))}
          <div className="menu-footer">
            <i className="fas fa-check-circle"></i> Production Authority
          </div>
        </div>

        <div className="dashboard-content">
          <div className="welcome-banner">
            <div className="welcome-content">
              <h2><i className="fas fa-clipboard-list"></i> Pending Applications</h2>
              <p>Review and process worker applications</p>
            </div>
            <div className="date-display">
              <i className="fas fa-calendar-alt"></i>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3><i className="fas fa-clock"></i> Pending Production Review ({workers.length})</h3>
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search by name, department..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={fetchWorkers} className="btn-primary-sm"><i className="fas fa-sync-alt"></i> Refresh</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#1e3a8a' }}></i>
                <p>Loading workers...</p>
              </div>
            ) : workers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fas fa-check-circle" style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }}></i>
                <h4>No Pending Applications</h4>
                <p>All workers have been processed.</p>
              </div>
            ) : (
              <div className="employee-grid">
                {filteredWorkers.map(worker => (
                  <div key={worker._id} className="employee-card" onClick={() => handleReview(worker)}>
                    <div className="employee-avatar" style={{ background: '#3b82f6' }}>
                      {worker.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'WK'}
                    </div>
                    <div className="employee-info">
                      <h4>{worker.fullName}</h4>
                      <p><i className="fas fa-building"></i> {worker.department || 'Not Assigned'}</p>
                      <p><i className="fas fa-briefcase"></i> {worker.designation || 'Worker'}</p>
                      <p className="employee-status pending"><i className="fas fa-hourglass-half"></i> Pending Production Review</p>
                    </div>
                    <button className="btn-review-small">Review <i className="fas fa-arrow-right"></i></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedWorker && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: '#1e3a8a', color: 'white' }}>
                <h3>Production Review - {selectedWorker.fullName}</h3>
                <button className="modal-close" onClick={() => setShowReviewModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4>Worker Details</h4>
                  <p><strong>Name:</strong> {selectedWorker.fullName}</p>
                  <p><strong>Mobile:</strong> {selectedWorker.mobile || 'N/A'}</p>
                  <p><strong>Experience:</strong> {selectedWorker.experience || '0'} years</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label>DEPARTMENT *</label>
                    <select 
                      value={reviewData.department} 
                      onChange={(e) => setReviewData({ ...reviewData, department: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      {departmentList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>DESIGNATION *</label>
                    <select 
                      value={reviewData.designation} 
                      onChange={(e) => setReviewData({ ...reviewData, designation: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      {designationList.map(des => <option key={des} value={des}>{des}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>CATEGORY *</label>
                    <select 
                      value={reviewData.category} 
                      onChange={(e) => setReviewData({ ...reviewData, category: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>DAILY RATE (₹) *</label>
                    <input 
                      type="number" 
                      value={reviewData.rate} 
                      onChange={(e) => setReviewData({ ...reviewData, rate: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <small>Monthly: ₹{(reviewData.rate * 26).toLocaleString()}</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px', borderTop: '1px solid #eee' }}>
                <button className="btn-approve" onClick={handleApprove} disabled={loading} style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {loading ? 'Processing...' : 'Approve & Send to CEO'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="dashboard-layout">
      <div className="side-menu">
        <div className="menu-header">
          <i className="fas fa-industry"></i>
          <div>
            <h3>LAXMI CONTRACTOR</h3>
            <p>Production Head Portal</p>
            <small>{session.userName}</small>
          </div>
        </div>
        {menuItems.map(item => (
          <div key={item.id} className={`menu-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)}>
            <i className={`fas fa-${item.icon}`}></i>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
          </div>
        ))}
        <div className="menu-footer">
          <i className="fas fa-check-circle"></i> Production Authority
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2><i className="fas fa-chart-line"></i> Production Dashboard</h2>
            <p>Review and manage worker applications</p>
          </div>
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="TOTAL WORKERS" value={stats.totalRegistered} icon="users" color="#3b82f6" filterTab="all" />
          <StatCard title="PENDING PRODUCTION" value={stats.pendingProduction} icon="clock" color="#f59e0b" filterTab="production" />
          <StatCard title="PENDING CEO" value={stats.pendingCEO} icon="user-tie" color="#8b5cf6" filterTab="ceo" />
          <StatCard title="PENDING HR" value={stats.pendingHR} icon="users" color="#10b981" filterTab="hr" />
          <StatCard title="FINALIZED" value={stats.finalized} icon="check-circle" color="#28c95b" filterTab="finalized" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3>Employee Tracking</h3>
            <div className="search-box">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={fetchWorkers} className="btn-primary-sm">Refresh</button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>DEPARTMENT</th>
                  <th>DESIGNATION</th>
                  <th>PUNCH CODE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {displayWorkers
                  .filter(w => w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(worker => (
                    <tr key={worker._id}>
                      <td><strong>{worker.fullName}</strong></td>
                      <td>{worker.department || 'N/A'}</td>
                      <td>{worker.designation || 'Worker'}</td>
                      <td><code>{worker.punchCode || 'N/A'}</code></td>
                      <td>{getStageBadge(worker.status)}</td>
                      <td>
                        {(worker.status === 'pending_contractor' || worker.status === 'pending_production') && (
                          <button className="btn-review-small" onClick={() => handleReview(worker)}>Review</button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;