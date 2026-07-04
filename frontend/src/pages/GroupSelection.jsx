import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, Users, Compass, Loader2 } from 'lucide-react';

export default function GroupSelection() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.getGroups();
        setGroups(data);
        
        // Auto-select and navigate if student only has exactly one group
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'STUDENT' && data.length === 1) {
          handleSelectGroup(data[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load cohorts.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleSelectGroup = async (group) => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || {};
      if (user.role === 'STUDENT') {
        await api.joinGroup(group.id);
      }
      
      user.groupId = group.id;
      user.groupName = group.name;
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/activities');
    } catch (err) {
      setError(err.message || 'Failed to enroll in the selected cohort.');
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="cohort-container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Select Your Learning Cohort
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Choose a cohort group to view your interactive timeline and assignments.
          </p>
        </div>

        {error && (
          <div className="chat-bubble system margin-bottom-2 text-center" style={{ width: '100%' }}>
            {error}
          </div>
        )}

        {groups.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '3rem' }}>
            <Compass size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
            <h3>No cohorts available</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              No cohort groups have been created yet. Please check back later or contact your administrator.
            </p>
          </div>
        ) : (
          <div className="cohort-grid">
            {groups.map((group) => (
              <div
                key={group.id}
                className="glass-card glass-card-hover cohort-card"
                onClick={() => handleSelectGroup(group)}
              >
                <div className="flex-between margin-bottom-1">
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                    <BookOpen size={24} />
                  </div>
                  {group._count && (
                    <span className="flex-center" style={{ gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Users size={14} />
                      {group._count.users} students
                    </span>
                  )}
                </div>
                <h3>{group.name}</h3>
                <p>{group.description || 'No description available for this cohort.'}</p>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                    Enter Space →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
