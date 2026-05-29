import React, { useState, useEffect } from 'react';
import Login from '../src/components/Login';
import ContractorDashboard from '../src/components/ContractorDashboard';
import ProductionDashboard from '../src/components/ProductionHeadDashboard';
import CEODashboard from '../src/components/CEODashboard';
import HRDashboard from '../src/components/HRDashboard';
import AdminDashboard from '../src/components/AdminDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  useEffect(() => {
    const savedSession = localStorage.getItem('laxmi_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
      } catch (e) {
        console.error('Error parsing session:', e);
        localStorage.removeItem('laxmi_session');
      }
    }
  }, []);

  const handleLogin = (user) => {
    console.log("Login user:", user);
    console.log("User role:", user.role);
    
    const newSession = {
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      loginId: user.email,
      loginTime: new Date().toISOString()
    };
    setSession(newSession);
    localStorage.setItem('laxmi_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('laxmi_session');
  };

  // Agar session nahi hai toh login page dikhao
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  // Session hai toh role ke according dashboard dikhao
  console.log("Rendering dashboard for role:", session.userRole);

  switch (session.userRole) {
    case 'contractor':
      return <ContractorDashboard 
        session={session} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
      />;
    case 'production':
      return <ProductionDashboard 
        session={session} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
      />;
    case 'ceo':
      return <CEODashboard 
        session={session} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
      />;
    case 'hr':
      return <HRDashboard 
        session={session} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
      />;
    case 'admin':
      return <AdminDashboard 
        session={session} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
      />;
    default:
      console.log("Unknown role:", session.userRole);
      // Agar unknown role hai toh logout karke login page pe bhejo
      localStorage.removeItem('laxmi_session');
      return <Login onLogin={handleLogin} />;
  }
}

export default App;