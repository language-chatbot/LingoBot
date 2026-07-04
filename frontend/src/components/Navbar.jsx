import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, GraduationCap, LayoutDashboard, User, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token || !user) return null;

  return (
    <nav className="navbar">
      <Link to={user.role === 'ADMIN' ? '/admin' : '/groups'} className="nav-logo">
        <GraduationCap size={28} />
        <span>LingoQuest</span>
      </Link>

      <div className="nav-links">
        {user.role === 'ADMIN' && (
          <>
            {location.pathname.startsWith('/admin') ? (
              <Link to="/groups" className="btn btn-secondary btn-sm">
                <GraduationCap size={16} />
                <span>Student View</span>
              </Link>
            ) : (
              <Link to="/admin" className="btn btn-primary btn-sm">
                <LayoutDashboard size={16} />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </>
        )}

        <div className="user-badge">
          <User size={14} />
          <span>{user.name}</span>
          <span className="user-role">{user.role}</span>
          {user.role === 'STUDENT' && user.groupName && (
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
              [{user.groupName}]
            </span>
          )}
        </div>

        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-sm" 
          title="Toggle Theme"
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
