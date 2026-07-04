import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, Headphones, Video, CheckCircle2, Circle, Play, ArrowLeft, Loader2 } from 'lucide-react';

export default function ActivityList() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cohortName, setCohortName] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.groupId) {
      navigate('/groups');
      return;
    }
    setCohortName(user.groupName || 'My Cohort');

    const fetchActivities = async () => {
      try {
        const data = await api.getActivities(user.groupId);
        setActivities(data);
      } catch (err) {
        setError(err.message || 'Failed to load activities checklist.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [navigate]);

  const handleActivityClick = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'READING':
        return <BookOpen size={20} />;
      case 'LISTENING':
        return <Headphones size={20} />;
      case 'VIDEO':
        return <Video size={20} />;
      default:
        return <BookOpen size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="activity-badge completed">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="activity-badge in-progress">In Progress</span>;
      default:
        return <span className="activity-badge not-started">Not Started</span>;
    }
  };

  const getStatusBullet = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
      case 'IN_PROGRESS':
        return <Play size={10} fill="var(--accent-primary)" style={{ color: 'var(--accent-primary)' }} />;
      default:
        return <Circle size={12} style={{ color: 'var(--text-dim)' }} />;
    }
  };

  // Calculate stats
  const completedCount = activities.filter(a => a.status === 'COMPLETED').length;
  const progressPercent = activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="activity-map-container">
        
        {/* Back navigation */}
        <button onClick={() => navigate('/groups')} className="btn btn-secondary btn-sm margin-bottom-2" style={{ gap: '0.4rem' }}>
          <ArrowLeft size={14} />
          <span>Switch Cohort</span>
        </button>

        <div className="activity-map-header">
          <div>
            <h1 style={{ fontSize: '2rem' }}>{cohortName}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Follow your curated path to complete activities.</p>
          </div>
        </div>

        {error && (
          <div className="chat-bubble system margin-bottom-2 text-center" style={{ width: '100%' }}>
            {error}
          </div>
        )}

        {/* Progress Tracker */}
        <div className="progress-track-wrapper">
          <div className="flex-between">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Progress Map</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
              {completedCount} / {activities.length} Activities ({progressPercent}%)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '3rem' }}>
            <Compass size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
            <h3>No activities assigned</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Your teacher has not uploaded any activities for this cohort yet.
            </p>
          </div>
        ) : (
          <div className="activity-timeline">
            {activities.map((activity, index) => {
              const statusClass = activity.status ? activity.status.toLowerCase() : 'not_started';
              return (
                <div key={activity.id} className={`activity-node ${statusClass}`}>
                  {/* Timeline Bullet node */}
                  <div className="activity-node-bullet">
                    {getStatusBullet(activity.status)}
                  </div>

                  {/* Activity Detail Card */}
                  <div 
                    className="glass-card activity-node-card glass-card-hover"
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    <div className="activity-meta">
                      <div className="activity-icon-container">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Step {index + 1} • {activity.type}
                        </div>
                        <div className="activity-title">{activity.title}</div>
                      </div>
                    </div>

                    <div>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
