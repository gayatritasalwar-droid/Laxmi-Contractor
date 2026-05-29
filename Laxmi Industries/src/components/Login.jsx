import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginId, password })
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        const session = {
          userId: data.user._id,
          userName: data.user.name,
          userRole: data.user.role,
          loginId: data.user.email,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('laxmi_session', JSON.stringify(session));
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Make sure backend is running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <div className="logo-text">LC</div>
        </div>

        <h1>LAXMI CONTRACTOR</h1>
        <p className="subtitle">Enterprise Workforce Management System</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>
              <i className="fas fa-envelope"></i> Email / Login ID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

         {/* <div className="demo-creds">
          <strong>📋 Login Credentials:</strong>
          <div className="creds-grid">
            <div>👷 Contractor: c / c123</div>
            <div>🏭 Production: ph / ph123</div>
            <div>👔 CEO: ceo / ceo123</div>
            <div>📋 HR: hr / hr123</div>
            <div>👑 Admin: a / a123</div>
          </div> 
        </div>  */}
      </div>
    </div>
  );
};

export default Login;