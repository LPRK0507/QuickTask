const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-a-env-file';

// Middleware
app.use(cors());
app.use(express.json());

// --- FAKE USER DATABASE ---
const users = [{ id: 1, username: 'user' }];
const HASHED_PASSWORD = 'password'; // In a real app, this would be hashed!

// --- In-memory task database ---
let tasks = [
  { id: 1, title: 'Sample Task 1', description: 'This is a description.', completed: false },
  { id: 2, title: 'Sample Task 2', description: 'This is another description.', completed: true },
];
let nextId = 3;


// --- API Endpoints ---

// POST /login – Login a user
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === users[0].username && password === HASHED_PASSWORD) {
    const user = { userId: users[0].id, username: users[0].username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden (token is no longer valid)
    }
    req.user = user;
    next();
  });
};

// --- Protected Task Routes ---
// All routes below this line will require a valid JWT.

// GET /tasks – List all tasks
app.get('/tasks', authenticateToken, (req, res) => {
  res.json(tasks);
});

// POST /tasks – Add a new task
app.post('/tasks', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = {
    id: nextId++,
    title,
    description: description || '',
    completed: false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PATCH /tasks/:id – Update completion status
app.patch('/tasks/:id', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.completed = !task.completed;
  res.json(task);
});

// DELETE /tasks/:id – Delete a task
app.delete('/tasks/:id', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send(); // No content
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});