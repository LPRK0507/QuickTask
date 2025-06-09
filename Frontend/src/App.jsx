import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3001';

// --- Login Form Component ---
function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      return res.json();
    })
    .then(data => {
      onLogin(data.token);
    })
    .catch(err => {
      setError(err.message);
    });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to QuickTasks</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="text"
          placeholder="Username (user)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (password)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// --- Task Tracker Component ---
function TaskTracker({ token, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState('ALL');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/tasks`, { headers: getAuthHeaders() })
      .then(res => {
        if (res.status === 401 || res.status === 403) onLogout();
        return res.json();
      })
      .then(data => {
        if (data) setTasks(data)
      })
      .catch(console.error);
  }, [token, onLogout]);

  const addTask = (e) => {
    e.preventDefault();
    if (!title) return;
    fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description }),
    })
    .then(res => res.json())
    .then(data => {
        setTasks([...tasks, data]);
        setTitle('');
        setDescription('');
    });
  };

  const toggleComplete = (id) => {
    fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'PATCH', headers: getAuthHeaders() })
      .then(res => res.json())
      .then(updatedTask => {
        setTasks(tasks.map(task => (task.id === id ? updatedTask : task)));
      });
  };

  const deleteTask = (id) => {
    fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(() => {
        setTasks(tasks.filter(task => task.id !== id));
      });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'COMPLETED') return task.completed;
    if (filter === 'INCOMPLETE') return !task.completed;
    return true;
  });

  return (
    <div className="app">
      <header>
        <h1>QuickTasks</h1>
        <p>A Simple Task Tracker</p>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>
      <div className="task-adder">
        <form onSubmit={addTask}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task Description"
          />
          <button type="submit">Add Task</button>
        </form>
      </div>

      <div className="filter-buttons">
        <button onClick={() => setFilter('ALL')} className={filter === 'ALL' ? 'active' : ''}>All</button>
        <button onClick={() => setFilter('COMPLETED')} className={filter === 'COMPLETED' ? 'active' : ''}>Completed</button>
        <button onClick={() => setFilter('INCOMPLETE')} className={filter === 'INCOMPLETE' ? 'active' : ''}>Incomplete</button>
      </div>

      <div className="task-list">
        {filteredTasks.map(task => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div className="task-details">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>
            <div className="task-actions">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task.id)}
              />
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Controller Component ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div>
      {token ? (
        <TaskTracker token={token} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;