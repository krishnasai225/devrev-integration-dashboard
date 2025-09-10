import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

interface WorkItem {
  id: string;
  display_id: string;
  title: string;
  type: string;
  stage: {
    name: string;
  };
  created_date: string;
}

interface CreateTicketData {
  title: string;
  body: string;
  type: 'ticket' | 'issue';
}

function App() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Create ticket form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketData>({
    title: '',
    body: '',
    type: 'ticket'
  });

  const DEVREV_API_BASE = 'https://api.devrev.ai';

  const testAuthentication = async () => {
    if (!apiToken.trim()) {
      setError('Please enter your DevRev API token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${DEVREV_API_BASE}/dev-users.self`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.dev_user) {
        setIsAuthenticated(true);
        setError('');
        fetchWorkItems();
      }
    } catch (err: any) {
      setError(`Authentication failed: ${err.response?.data?.message || err.message}`);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkItems = async () => {
    if (!apiToken) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${DEVREV_API_BASE}/works.list`,
        {
          limit: 10,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.works) {
        setWorkItems(response.data.works);
      }
    } catch (err: any) {
      setError(`Failed to fetch work items: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createWorkItem = async () => {
    if (!newTicket.title.trim() || !newTicket.body.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${DEVREV_API_BASE}/works.create`,
        {
          title: newTicket.title,
          body: newTicket.body,
          type: newTicket.type,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.work) {
        setNewTicket({ title: '', body: '', type: 'ticket' });
        setShowCreateForm(false);
        fetchWorkItems(); // Refresh the list
        setError('');
      }
    } catch (err: any) {
      setError(`Failed to create work item: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="auth-container">
          <h1>DevRev Integration Dashboard</h1>
          <p>Enter your DevRev Personal Access Token to get started</p>
          
          <div className="auth-form">
            <input
              type="password"
              placeholder="DevRev API Token (PAT)"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="token-input"
            />
            <button 
              onClick={testAuthentication} 
              disabled={loading}
              className="auth-button"
            >
              {loading ? 'Connecting...' : 'Connect to DevRev'}
            </button>
            
            <div className="demo-section">
              <p><strong>🎭 Demo Mode</strong></p>
              <p>DevRev is currently in closed beta. You can view the UI and code architecture.</p>
              <button 
                onClick={() => setIsAuthenticated(true)} 
                className="demo-button"
              >
                View Demo Dashboard
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="instructions">
            <h3>How to get your API token:</h3>
            <ol>
              <li>Sign up at <a href="https://devrev.ai" target="_blank" rel="noopener noreferrer">DevRev.ai</a></li>
              <li>Go to Settings → Account → Personal Access Token</li>
              <li>Click "New token" and copy the generated token</li>
              <li>Paste it above to connect</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>DevRev Integration Dashboard</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="create-button"
          >
            {showCreateForm ? 'Cancel' : 'Create Ticket'}
          </button>
          <button 
            onClick={fetchWorkItems}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Work Item</h3>
          <div className="form-group">
            <label>Type:</label>
            <select 
              value={newTicket.type} 
              onChange={(e) => setNewTicket({...newTicket, type: e.target.value as 'ticket' | 'issue'})}
            >
              <option value="ticket">Ticket</option>
              <option value="issue">Issue</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={newTicket.title}
              onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
              placeholder="Enter work item title"
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newTicket.body}
              onChange={(e) => setNewTicket({...newTicket, body: e.target.value})}
              placeholder="Enter work item description"
              rows={4}
            />
          </div>
          <button onClick={createWorkItem} disabled={loading} className="submit-button">
            {loading ? 'Creating...' : 'Create Work Item'}
          </button>
        </div>
      )}

      <main className="work-items-container">
        <h2>Work Items ({workItems.length})</h2>
        
        {workItems.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No work items found. Create your first ticket above!</p>
          </div>
        ) : (
          <div className="work-items-list">
            {workItems.map((item) => (
              <div key={item.id} className="work-item-card">
                <div className="work-item-header">
                  <span className="work-item-id">{item.display_id}</span>
                  <span className={`work-item-type ${item.type}`}>{item.type}</span>
                  <span className="work-item-stage">{item.stage?.name || 'No stage'}</span>
                </div>
                <h3 className="work-item-title">{item.title}</h3>
                <p className="work-item-date">Created: {formatDate(item.created_date)}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;