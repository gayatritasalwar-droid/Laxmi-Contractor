import React, { useState } from 'react';
import './CommonStyles.css';
import AdminDashboard from './AdminDashboard';
import CEODashboard from './CEODashboard';
import HRDashboard from './HRDashboard';
import ProductionHeadDashboard from './ProductionHeadDashboard';
import ContractorDashboard from './ContractorDashboard';
import WorkerDashboard from './WorkerDashboard';

const Dashboard = ({ session, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderDashboard = () => {
    switch (session.role) {
      case 'admin': return <AdminDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'ceo': return <CEODashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'hr': return <HRDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'production_head': return <ProductionHeadDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'contractor': return <ContractorDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      case 'worker': return <WorkerDashboard session={session} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
      default: return <div>Dashboard</div>;
    }
  };

  return renderDashboard();
};

export default Dashboard;