import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Route Handlers
import authRouter from './routes/auth.js';
import groupsRouter from './routes/groups.js';
import activitiesRouter from './routes/activities.js';
import contentRouter from './routes/content.js';
import glossaryRouter from './routes/glossary.js';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: [
    CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5176'
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Static serving of uploaded files (audio, video, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Bind routers to path namespaces
app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/content', contentRouter);
app.use('/api/glossary', glossaryRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);

// Catch-all route for unmatched API queries
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ 
    error: 'An internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`Express API listening at: http://localhost:${PORT}`);
});
