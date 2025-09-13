import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import storyRoutes from './routes/storyRoutes.js';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - serve the client directory
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'assets')));

// Create directories if they don't exist
async function createDirectories() {
  const dirs = [
    path.join(__dirname, '..', 'client', 'assets', 'generated'),
    path.join(__dirname, '..', 'client', 'assets', 'temp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Routes
app.use('/api/story', storyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Children\'s Story Generator API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Catch-all route - serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start server
async function startServer() {
  try {
    await createDirectories();
    
    app.listen(PORT, () => {
      console.log(`
🌟 Children's Story Generator Server Started! 🌟
═══════════════════════════════════════════════
📚 Server running at: http://localhost:${PORT}
🎨 Ready to create magical stories!
🚀 API Health: http://localhost:${PORT}/api/health
═══════════════════════════════════════════════
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
