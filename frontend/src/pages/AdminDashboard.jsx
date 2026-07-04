import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Users, FolderOpen, Layers, FileText, BookOpen, TrendingUp, Plus, 
  Trash2, Loader2, Calendar, Shield, HelpCircle, Check, Search, Eye, MessageSquare
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown lists
  const [groups, setGroups] = useState([]);
  const [contents, setContents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);

  // Stats State
  const [stats, setStats] = useState(null);

  // Group Form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Content Form
  const [contentType, setContentType] = useState('READING');
  const [contentText, setContentText] = useState('');
  const [contentFile, setContentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Glossary Tagger State
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedContentText, setSelectedContentText] = useState('');
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null); // { term, startOffset, endOffset, definition }

  // Activity Form
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState('READING');
  const [actGroupId, setActGroupId] = useState('');
  const [actContentId, setActContentId] = useState('');
  const [actOrder, setActOrder] = useState('');

  // Logs & Monitor filter state
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);

  // User rosters assignment form
  const [selectedUnassignedStudent, setSelectedUnassignedStudent] = useState('');

  // 1. Fetch dashboard context on load
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [groupsData, contentsData, activitiesData, studentsData, statsData] = await Promise.all([
        api.getGroups(),
        api.getContents(),
        api.getActivities(),
        api.getStudents(),
        api.getAdminStats()
      ]);

      setGroups(groupsData);
      setContents(contentsData);
      setActivities(activitiesData);
      setStudents(studentsData);
      setStats(statsData);
      
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync Admin Dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  // Refetch logs when filters change
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, filterGroup, filterStudent, filterActivity]);

  // Refetch stats when overview loads
  useEffect(() => {
    if (activeTab === 'overview') {
      api.getAdminStats().then(setStats).catch(console.error);
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      const logs = await api.getAdminLogs({
        groupId: filterGroup,
        studentId: filterStudent,
        activityId: filterActivity
      });
      setActivityLogs(logs.activityLogs);
      setChatLogs(logs.chatLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Group Actions
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await api.createGroup({ name: groupName.trim(), description: groupDesc.trim() });
      setGroupName('');
      setGroupDesc('');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group? This deletes all associated activities!')) return;
    try {
      await api.deleteGroup(id);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedGroup || !selectedUnassignedStudent) return;
    try {
      await api.assignStudent(selectedGroup.id, selectedUnassignedStudent);
      setSelectedUnassignedStudent('');
      
      // Update selected group users roster list
      const updatedGroup = await api.getGroupDetail(selectedGroup.id);
      setSelectedGroup(updatedGroup);
      
      // Refresh students
      const freshStudents = await api.getStudents();
      setStudents(freshStudents);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (!selectedGroup) return;
    try {
      await api.unassignStudent(selectedGroup.id, studentId);
      // Update group users roster
      const updatedGroup = await api.getGroupDetail(selectedGroup.id);
      setSelectedGroup(updatedGroup);
      
      // Refresh students
      const freshStudents = await api.getStudents();
      setStudents(freshStudents);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGroupSelect = async (groupId) => {
    try {
      const details = await api.getGroupDetail(groupId);
      setSelectedGroup(details);
    } catch (err) {
      alert(err.message);
    }
  };

  // Content Actions
  const handleContentSubmit = async (e) => {
    e.preventDefault();
    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append('type', contentType);
      
      if (contentType === 'READING') {
        formData.append('textBody', contentText);
      } else {
        if (!contentFile) throw new Error('Please select a file to upload.');
        formData.append('file', contentFile);
      }

      await api.uploadContent(formData);
      
      // Reset Form
      setContentText('');
      setContentFile(null);
      const fileInput = document.getElementById('content-file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      alert('Content added successfully to library!');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteContent = async (id) => {
    if (!confirm('Are you sure you want to delete this content item? This will delete any activities linked to it!')) return;
    try {
      await api.deleteContent(id);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Glossary Tagger Actions
  const handleSelectContentGlossary = async (contentId) => {
    setSelectedContentId(contentId);
    setSelectedTerm(null);
    if (!contentId) {
      setSelectedContentText('');
      setGlossaryTerms([]);
      return;
    }

    const item = contents.find(c => c.id === parseInt(contentId));
    setSelectedContentText(item?.textBody || '');
    
    try {
      const terms = await api.getGlossaryTerms(contentId);
      setGlossaryTerms(terms);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMouseSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const container = document.getElementById('tagger-display-box');
    if (!container) return;

    // character offset calculation
    try {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(container);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + selectedText.length;

      setSelectedTerm({
        term: selectedText,
        startOffset,
        endOffset,
        definition: ''
      });
    } catch (err) {
      console.error('Text selection range capture failure', err);
    }
  };

  const handleSaveGlossaryTerm = async () => {
    if (!selectedTerm || !selectedTerm.definition.trim()) {
      alert('Please fill out a definition for the selected term.');
      return;
    }

    try {
      await api.createGlossaryTerm({
        contentId: selectedContentId,
        term: selectedTerm.term,
        definition: selectedTerm.definition.trim(),
        startOffset: selectedTerm.startOffset,
        endOffset: selectedTerm.endOffset
      });

      setSelectedTerm(null);
      
      // Refresh terms list
      const freshTerms = await api.getGlossaryTerms(selectedContentId);
      setGlossaryTerms(freshTerms);
    } catch (err) {
      alert(err.message || 'Failed to save term definition.');
    }
  };

  const handleDeleteGlossaryTerm = async (termId) => {
    try {
      await api.deleteGlossaryTerm(termId);
      const freshTerms = await api.getGlossaryTerms(selectedContentId);
      setGlossaryTerms(freshTerms);
    } catch (err) {
      alert(err.message);
    }
  };

  // Activity Planner Actions
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!actTitle || !actGroupId || !actContentId) return;

    try {
      await api.createActivity({
        title: actTitle,
        type: actType,
        groupId: actGroupId,
        contentId: actContentId,
        orderIndex: actOrder ? parseInt(actOrder) : undefined
      });

      setActTitle('');
      setActOrder('');
      alert('Activity successfully created and assigned!');
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await api.deleteActivity(id);
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderActiveTabContent = () => {
    if (loading) {
      return (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-primary)' }} />
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="stats-grid">
              <div className="glass-card stats-card">
                <div className="stats-icon">
                  <Users size={24} />
                </div>
                <div className="stats-info">
                  <h4>Total Students</h4>
                  <div className="stats-val">{stats?.totalStudents || 0}</div>
                </div>
              </div>

              <div className="glass-card stats-card cyan">
                <div className="stats-icon">
                  <Layers size={24} />
                </div>
                <div className="stats-info">
                  <h4>Groups / Cohorts</h4>
                  <div className="stats-val">{stats?.totalGroups || 0}</div>
                </div>
              </div>

              <div className="glass-card stats-card">
                <div className="stats-icon">
                  <FileText size={24} />
                </div>
                <div className="stats-info">
                  <h4>Total Activities</h4>
                  <div className="stats-val">{stats?.totalActivities || 0}</div>
                </div>
              </div>

              <div className="glass-card stats-card green">
                <div className="stats-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stats-info">
                  <h4>Completion Rate</h4>
                  <div className="stats-val">{stats?.completionRate || 0}%</div>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="margin-bottom-1">Platform Activity Summary</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Breakdown of student activities by status category.
              </p>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}></div>
                  <span>Not Started: {stats?.statusBreakdown?.notStarted || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-primary)' }}></div>
                  <span>In Progress: {stats?.statusBreakdown?.inProgress || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }}></div>
                  <span>Completed: {stats?.statusBreakdown?.completed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Create Group and listing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-card">
                <h3 className="margin-bottom-1">Create Cohort</h3>
                <form onSubmit={handleCreateGroup}>
                  <div className="form-group">
                    <label className="form-label">Group Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Korean Middle School" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Optional details..." 
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <Plus size={16} />
                    <span>Add Group</span>
                  </button>
                </form>
              </div>

              <div className="glass-card">
                <h3 className="margin-bottom-1">Available Groups</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groups.map(g => (
                    <div 
                      key={g.id} 
                      className={`flex-between`} 
                      style={{ padding: '0.75rem 1rem', background: selectedGroup?.id === g.id ? 'var(--bg-card-hover)' : 'rgba(255,255,255,0.02)', border: selectedGroup?.id === g.id ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => handleGroupSelect(g.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.description || 'No description'}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '0.3rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roster management for selected group */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Roster: {selectedGroup?.name || 'Select a Group'}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Assign and remove student enrollment from this learning cohort.
              </p>

              {selectedGroup && (
                <div>
                  {/* Assign Form */}
                  <div className="flex-between margin-bottom-2" style={{ gap: '1rem', background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Select Unassigned Student</label>
                      <select 
                        className="form-input form-select"
                        value={selectedUnassignedStudent}
                        onChange={(e) => setSelectedUnassignedStudent(e.target.value)}
                      >
                        <option value="">-- Choose Student --</option>
                        {students
                          .filter(s => !s.groups?.some(g => g.id === selectedGroup.id))
                          .map(s => {
                            const groupList = s.groups && s.groups.length > 0
                              ? `[Current: ${s.groups.map(g => g.name).join(', ')}]`
                              : '';
                            return (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.email}) {groupList}
                              </option>
                            );
                          })
                        }
                      </select>
                    </div>
                    <button 
                      onClick={handleAssignStudent} 
                      className="btn btn-primary"
                      style={{ marginTop: '1.5rem', minHeight: '42px' }}
                      disabled={!selectedUnassignedStudent}
                    >
                      <Check size={16} />
                      <span>Assign</span>
                    </button>
                  </div>

                  {/* Active Students in this Group */}
                  <h4 className="margin-bottom-1" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Enrolled Students ({selectedGroup.users?.length || 0})</h4>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Enrollment Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!selectedGroup.users || selectedGroup.users.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="text-center" style={{ color: 'var(--text-muted)' }}>
                              No students enrolled in this cohort yet.
                            </td>
                          </tr>
                        ) : (
                          selectedGroup.users.map(u => (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 600 }}>{u.name}</td>
                              <td>{u.email}</td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  onClick={() => handleUnassignStudent(u.id)}
                                  className="btn btn-secondary btn-sm text-danger"
                                  style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                >
                                  Unassign
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'content':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Create Content form */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Add Content</h3>
              <form onSubmit={handleContentSubmit}>
                <div className="form-group">
                  <label className="form-label">Content Type</label>
                  <select 
                    className="form-input form-select"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="READING">Reading Passage (Text)</option>
                    <option value="LISTENING">Listening (Audio File)</option>
                    <option value="VIDEO">Video (Video File)</option>
                  </select>
                </div>

                {contentType === 'READING' ? (
                  <div className="form-group">
                    <label className="form-label">Article text body</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Paste article paragraphs here..." 
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={8}
                      style={{ resize: 'vertical' }}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Upload media File ({contentType === 'LISTENING' ? 'mp3, wav' : 'mp4, webm'})</label>
                    <input 
                      id="content-file-input"
                      type="file" 
                      className="form-input" 
                      onChange={(e) => setContentFile(e.target.files[0])}
                      accept={contentType === 'LISTENING' ? 'audio/*' : 'video/*'}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploadProgress}>
                  {uploadProgress ? <div className="spinner spinner-sm" /> : <Plus size={16} />}
                  <span>{uploadProgress ? 'Processing Upload...' : 'Save Content'}</span>
                </button>
              </form>
            </div>

            {/* List Content */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Content Library</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>List of uploaded text structures and physical media file entries.</p>
              
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Detail</th>
                      <th>Glossary Terms</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center" style={{ color: 'var(--text-muted)' }}>
                          No content entries stored in library.
                        </td>
                      </tr>
                    ) : (
                      contents.map(c => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>
                            <span className="activity-badge in-progress" style={{ background: c.type === 'READING' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(6, 182, 212, 0.15)', color: c.type === 'READING' ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                              {c.type}
                            </span>
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.type === 'READING' ? c.textBody : c.fileUrl}
                          </td>
                          <td>{c._count?.glossaryTerms || 0} terms</td>
                          <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              onClick={() => handleDeleteContent(c.id)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.3rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'glossary':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
            {/* Interactive Highlighter */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Interactive Glossary Tagger</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Select a Reading passage below. Highlight text with your mouse cursor to map vocabulary terms.
              </p>

              <div className="form-group">
                <label className="form-label">Select Reading Content</label>
                <select 
                  className="form-input form-select"
                  value={selectedContentId}
                  onChange={(e) => handleSelectContentGlossary(e.target.value)}
                >
                  <option value="">-- Choose Reading Passage --</option>
                  {contents.filter(c => c.type === 'READING').map(c => (
                    <option key={c.id} value={c.id}>ID: {c.id} - {c.textBody?.substring(0, 50)}...</option>
                  ))}
                </select>
              </div>

              {selectedContentText && (
                <div>
                  <h4 className="margin-bottom-1" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Passage Viewer (Highlight a word/phrase):</h4>
                  
                  {/* Text selection board */}
                  <div 
                    id="tagger-display-box"
                    className="tagger-passage-display"
                    onMouseUp={handleMouseSelection}
                  >
                    {selectedContentText}
                  </div>

                  {selectedTerm && (
                    <div className="tagger-selection-box">
                      <h4 style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                        <BookOpen size={16} />
                        <span>Tag Selection: "{selectedTerm.term}"</span>
                      </h4>
                      <div className="form-group">
                        <label className="form-label">Definition / Translation</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Traditional Korean clothing..." 
                          value={selectedTerm.definition}
                          onChange={(e) => setSelectedTerm({ ...selectedTerm, definition: e.target.value })}
                          required
                        />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        Character indices: Start offset {selectedTerm.startOffset}, End offset {selectedTerm.endOffset}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedTerm(null)} className="btn btn-secondary btn-sm">Cancel</button>
                        <button onClick={handleSaveGlossaryTerm} className="btn btn-primary btn-sm">Tag Vocabulary</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List glossary terms of selected content */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Tagged Glossary Terms</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tagged vocabulary definitions for the selected passage.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!selectedContentId ? (
                  <div className="text-center" style={{ color: 'var(--text-dim)', padding: '2rem' }}>
                    Select a reading passage to view tagged terms.
                  </div>
                ) : glossaryTerms.length === 0 ? (
                  <div className="text-center" style={{ color: 'var(--text-dim)', padding: '2rem' }}>
                    No tagged glossary terms for this passage yet. Select words above to start tagging.
                  </div>
                ) : (
                  glossaryTerms.map(term => (
                    <div key={term.id} className="flex-between" style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{term.term}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{term.definition}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          Offsets: [{term.startOffset} - {term.endOffset}]
                        </div>
                      </div>
                      <button onClick={() => handleDeleteGlossaryTerm(term.id)} className="btn btn-danger btn-sm" style={{ padding: '0.3rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Create Activity Form */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Add Group Activity</h3>
              <form onSubmit={handleCreateActivity}>
                <div className="form-group">
                  <label className="form-label">Activity Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Intro reading guide" 
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign to Cohort</label>
                  <select 
                    className="form-input form-select"
                    value={actGroupId}
                    onChange={(e) => setActGroupId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Cohort --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Type</label>
                  <select 
                    className="form-input form-select"
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                  >
                    <option value="READING">Reading Passage</option>
                    <option value="LISTENING">Listening (Audio Player)</option>
                    <option value="VIDEO">Video Player</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Content Resource</label>
                  <select 
                    className="form-input form-select"
                    value={actContentId}
                    onChange={(e) => setActContentId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Library Asset --</option>
                    {contents.filter(c => c.type === actType).map(c => (
                      <option key={c.id} value={c.id}>
                        ID: {c.id} - {c.type === 'READING' ? c.textBody?.substring(0, 40) + '...' : c.fileUrl?.substring(0, 40)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Index (Step index position)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 1" 
                    value={actOrder}
                    onChange={(e) => setActOrder(e.target.value)}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Leave blank to append to the end of the cohort.
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={16} />
                  <span>Create Activity</span>
                </button>
              </form>
            </div>

            {/* Activities List table */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Cohort Map Checklist Paths</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>List of activities currently published across all cohorts.</p>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cohort Group</th>
                      <th>Step</th>
                      <th>Activity Title</th>
                      <th>Type</th>
                      <th>Content Link</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center" style={{ color: 'var(--text-muted)' }}>
                          No activities created yet.
                        </td>
                      </tr>
                    ) : (
                      activities.map(act => (
                        <tr key={act.id}>
                          <td style={{ fontWeight: 600 }}>{act.group?.name}</td>
                          <td>{act.orderIndex}</td>
                          <td>{act.title}</td>
                          <td>
                            <span className="activity-badge completed" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                              {act.type}
                            </span>
                          </td>
                          <td>Asset ID: {act.contentId}</td>
                          <td>
                            <button 
                              onClick={() => handleDeleteActivity(act.id)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.3rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filter controls */}
            <div className="glass-card">
              <h3 className="margin-bottom-1">Audit Search & Filter Monitor</h3>
              <div className="filter-bar">
                <div className="filter-item">
                  <label className="form-label">Filter Cohort</label>
                  <select className="form-input form-select" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
                    <option value="">All Groups</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label className="form-label">Filter Student</label>
                  <select className="form-input form-select" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label className="form-label">Filter Activity</label>
                  <select className="form-input form-select" value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)}>
                    <option value="">All Activities</option>
                    {activities.map(a => <option key={a.id} value={a.id}>{a.title} ({a.group?.name})</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Split Logs panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Activity Completion Logs */}
              <div className="glass-card">
                <h3 className="margin-bottom-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                  <span>Activity Progress Audits</span>
                </h3>
                <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Activity</th>
                        <th>Status</th>
                        <th>Completed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center" style={{ color: 'var(--text-dim)', padding: '2rem' }}>
                            No activity status logs match the filters.
                          </td>
                        </tr>
                      ) : (
                        activityLogs.map(log => (
                          <tr key={log.id}>
                            <td>{log.student?.name}</td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.activity?.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.activity?.group?.name}</div>
                            </td>
                            <td>
                              <span className={`activity-badge ${log.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {log.completedAt ? new Date(log.completedAt).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chat conversations logs */}
              <div className="glass-card">
                <h3 className="margin-bottom-1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span>LingoBot Dialogue logs</span>
                </h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                  {chatLogs.length === 0 ? (
                    <div className="text-center" style={{ color: 'var(--text-dim)', padding: '4rem 0' }}>
                      No chatbot logs match the filters.
                    </div>
                  ) : (
                    chatLogs.map(log => (
                      <div 
                        key={log.id} 
                        style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        <div className="flex-between margin-bottom-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{log.student?.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {log.activity?.title}
                          </span>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong style={{ textTransform: 'capitalize', color: log.role === 'user' ? 'var(--accent-primary)' : 'var(--success)' }}>
                            {log.role === 'user' ? 'Student' : 'LingoBot'}:
                          </strong>{' '}
                          <span style={{ color: 'var(--text-main)' }}>{log.message}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-workspace">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="flex-center" style={{ gap: '0.5rem', padding: '0.5rem 0 1.5rem 0', color: 'var(--accent-primary)', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
          <Shield size={20} />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>ADMIN PORTAL</span>
        </div>

        <button 
          onClick={() => setActiveTab('overview')} 
          className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <TrendingUp size={16} />
          <span>Overview Stats</span>
        </button>

        <button 
          onClick={() => setActiveTab('groups')} 
          className={`admin-sidebar-btn ${activeTab === 'groups' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>Groups & Rosters</span>
        </button>

        <button 
          onClick={() => setActiveTab('content')} 
          className={`admin-sidebar-btn ${activeTab === 'content' ? 'active' : ''}`}
        >
          <FolderOpen size={16} />
          <span>Content Library</span>
        </button>

        <button 
          onClick={() => setActiveTab('glossary')} 
          className={`admin-sidebar-btn ${activeTab === 'glossary' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          <span>Glossary Tagger</span>
        </button>

        <button 
          onClick={() => setActiveTab('activities')} 
          className={`admin-sidebar-btn ${activeTab === 'activities' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Activity Planner</span>
        </button>

        <button 
          onClick={() => setActiveTab('logs')} 
          className={`admin-sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`}
        >
          <FileText size={16} />
          <span>Logs & Audit Checks</span>
        </button>
      </div>

      {/* Main Workspace content */}
      <div className="admin-content-pane">
        <div className="admin-header-row">
          <div>
            <h1 style={{ textTransform: 'capitalize', fontSize: '2rem' }}>{activeTab === 'overview' ? 'Control Panel Overview' : activeTab}</h1>
            <p style={{ color: 'var(--text-muted)' }}>LingoQuest centralized administrative management dashboard.</p>
          </div>
        </div>

        {error && (
          <div className="chat-bubble system margin-bottom-2 text-center" style={{ width: '100%' }}>
            {error}
          </div>
        )}

        {renderActiveTabContent()}
      </div>
    </div>
  );
}
