import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  BookOpen, Headphones, Video, MessageSquare, Send, CheckCircle, 
  ArrowLeft, RefreshCw, AlertCircle, Sparkles, Loader2 
} from 'lucide-react';
const renderMessageContent = (text) => {
  if (!text) return '';
  
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    // Process markdown bold (**bold**)
    const parts = line.split('**');
    const lineElements = parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return <strong key={partIdx}>{part}</strong>;
      }
      
      // Process markdown italic (*italic*)
      const italicParts = part.split('*');
      if (italicParts.length > 1) {
        return italicParts.map((iPart, iPartIdx) => {
          if (iPartIdx % 2 === 1) {
            return <em key={iPartIdx}>{iPart}</em>;
          }
          return iPart;
        });
      }
      
      return part;
    });

    return (
      <div key={lineIdx} style={{ minHeight: line.trim() === '' ? '0.8em' : 'auto' }}>
        {lineElements}
      </div>
    );
  });
};

export default function ActivityViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  
  // Tooltip popup glossary state
  const [activeTooltip, setActiveTooltip] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch activity details
        const actData = await api.getActivityDetail(id);
        setActivity(actData);

        // Fetch chat logs
        const chatLogs = await api.getChatHistory(id);
        setMessages(chatLogs);

        // Set log status to IN_PROGRESS on load
        await api.updateActivityLog(id, 'IN_PROGRESS');
      } catch (err) {
        setError(err.message || 'Failed to load activity workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close glossary tooltip on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleWordClick = (e, term) => {
    e.stopPropagation(); // Avoid triggering close listener
    if (activeTooltip && activeTooltip.id === term.id) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(term);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setChatError('');
    setChatLoading(true);

    // Optimistic user bubble append
    const localUserMsg = { id: Date.now(), role: 'user', message: userText, createdAt: new Date() };
    setMessages(prev => [...prev, localUserMsg]);

    try {
      const assistantReply = await api.sendChatMessage(id, userText);
      setMessages(prev => [...prev, assistantReply]);
    } catch (err) {
      setChatError(err.message || 'Failed to send message.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await api.updateActivityLog(id, 'COMPLETED');
      // Update activity status locally
      setActivity(prev => ({
        ...prev,
        activityLogs: [{ status: 'COMPLETED' }]
      }));
      // Alert completion and navigate back
      alert('Activity successfully marked as completed!');
      navigate('/activities');
    } catch (err) {
      alert(err.message || 'Failed to update completion status.');
    }
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const renderReadingText = () => {
    if (!activity?.content?.textBody) return null;
    const text = activity.content.textBody;
    const terms = activity.content.glossaryTerms || [];

    if (terms.length === 0) {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>;
    }

    // Sort terms by startOffset ascending
    const sortedTerms = [...terms].sort((a, b) => a.startOffset - b.startOffset);
    const elements = [];
    let lastIndex = 0;

    sortedTerms.forEach((term, index) => {
      // Validate offsets
      if (term.startOffset < lastIndex || term.endOffset > text.length || term.startOffset > term.endOffset) {
        return;
      }

      // Add leading plain text
      if (term.startOffset > lastIndex) {
        elements.push(text.substring(lastIndex, term.startOffset));
      }

      // Add clickable glossary highlight
      const wordText = text.substring(term.startOffset, term.endOffset);
      elements.push(
        <span
          key={`term-${term.id}-${index}`}
          className="glossary-word"
          onClick={(e) => handleWordClick(e, term)}
        >
          {wordText}
          {activeTooltip && activeTooltip.id === term.id && (
            <span className="glossary-tooltip-overlay" onClick={(e) => e.stopPropagation()}>
              <h4>{term.term}</h4>
              <p>{term.definition}</p>
            </span>
          )}
        </span>
      );

      lastIndex = term.endOffset;
    });

    // Add trailing plain text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <p style={{ whiteSpace: 'pre-wrap' }}>{elements}</p>;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="main-content flex-center" style={{ minHeight: '300px' }}>
        <div className="glass-card text-center" style={{ maxWidth: '500px' }}>
          <AlertCircle size={40} className="text-danger" style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Activity</h3>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{error || 'Target activity could not be found.'}</p>
          <button onClick={() => navigate('/activities')} className="btn btn-secondary btn-sm">
            Back to Checklist
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = activity.activityLogs && activity.activityLogs.some(log => log.status === 'COMPLETED');

  return (
    <div className="split-workspace-container">
      
      {/* Left Pane - Content Workspace */}
      <div className="pane left-pane">
        <div className="pane-header">
          <button onClick={() => navigate('/activities')} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <ArrowLeft size={14} />
            <span>Map</span>
          </button>

          <h2 style={{ fontSize: '1.1rem', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activity.title}
          </h2>

          <button 
            onClick={handleMarkComplete} 
            className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-success'}`}
            disabled={isCompleted}
            style={{ gap: '0.4rem' }}
          >
            <CheckCircle size={14} />
            <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>

        <div className="pane-body">
          {activity.type === 'READING' && (
            <div className="reading-content-view">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>
                <BookOpen size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Glossary Reader</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                💡 Click on the <span style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>underlined vocabulary terms</span> to display translation and definitions.
              </div>
              {renderReadingText()}
            </div>
          )}

          {activity.type === 'LISTENING' && (
            <div className="media-container">
              <div className="media-player-wrapper">
                <div className="media-art">
                  <Headphones size={48} />
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Listening Exercise</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Play the audio guide below and answer questions or discuss the content with LingoBot.</p>
                </div>
                <div className="audio-controls">
                  <audio 
                    src={getFileUrl(activity.content?.fileUrl)} 
                    controls 
                    className="audio-element"
                  />
                </div>
              </div>
            </div>
          )}

          {activity.type === 'VIDEO' && (
            <div className="media-container" style={{ maxWidth: '850px' }}>
              <div className="video-wrapper">
                <video 
                  src={getFileUrl(activity.content?.fileUrl)} 
                  controls 
                  className="video-element"
                />
              </div>
              <div className="margin-top-1" style={{ width: '100%', textAlign: 'left' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)' }}>
                  <Video size={18} />
                  <span>Vlog Companion Tutee</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                  Watch the travel video, take notes, and converse with the chatbot to evaluate key aspects of culture and grammar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Chatbot Assistance */}
      <div className="pane right-pane">
        <div className="pane-header" style={{ background: 'var(--bg-card)' }}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 600 }}>LingoBot Chat</span>
          </div>
          <span className="flex-center" style={{ gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Sparkles size={12} style={{ color: 'var(--accent-secondary)' }} />
            OpenAI Enabled
          </span>
        </div>

        <div className="chat-container">
          <div className="chat-message-list">
            
            {/* System welcome greeting */}
            <div className="chat-bubble assistant">
              {renderMessageContent("Hello! I am your interactive tutor. Let's discuss this activity's material. You can ask me to translate sentences, define items, or explain concepts. What questions do you have?")}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                {renderMessageContent(msg.message)}
              </div>
            ))}

            {chatLoading && (
              <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 className="spinner spinner-sm" />
                <span>LingoBot is thinking...</span>
              </div>
            )}

            {chatError && (
              <div className="chat-bubble system">
                ❌ {chatError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                className="chat-textbox"
                placeholder="Ask LingoBot about this lesson..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', minHeight: '44px' }} 
                disabled={chatLoading || !inputMessage.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
