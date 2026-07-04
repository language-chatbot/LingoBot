import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GraduationCap, Lock, Mail, AlertCircle, HelpCircle, User, Sun, Moon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelper, setShowHelper] = useState(true);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && !name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const data = await api.register({
          name: name.trim(),
          email: email.trim(),
          password
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/groups');
      } else {
        const data = await api.login(email.trim(), password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/groups');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button 
        onClick={toggleTheme} 
        className="btn btn-secondary" 
        style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', padding: '0.6rem', borderRadius: '50%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="flex-center margin-bottom-1" style={{ color: 'var(--accent-primary)' }}>
            <GraduationCap size={48} />
          </div>
          <h1>LingoQuest</h1>
          <p style={{ color: 'var(--text-muted)' }}>Interactive Language Education Platform</p>
        </div>

        {error && (
          <div className="chat-bubble system margin-bottom-1" style={{ width: '100%' }}>
            <div className="flex-center" style={{ gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {showHelper && (
          <div className="margin-top-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
            <div className="flex-between margin-bottom-1">
              <span className="flex-center" style={{ gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                <HelpCircle size={14} />
                Demo Credentials
              </span>
              <button 
                onClick={() => setShowHelper(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Hide
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <strong>Teacher Admin:</strong><br />
                Email: <code style={{ color: 'var(--text-main)' }}>admin@example.com</code><br />
                Password: <code style={{ color: 'var(--text-main)' }}>password123</code>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              <div>
                <strong>Student Alice:</strong><br />
                Email: <code style={{ color: 'var(--text-main)' }}>student@example.com</code><br />
                Password: <code style={{ color: 'var(--text-main)' }}>password123</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
