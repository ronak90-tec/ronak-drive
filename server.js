const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ronak2326';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize data files
const filesPath = path.join(dataDir, 'files.json');
const usersPath = path.join(dataDir, 'users.json');
const accessPath = path.join(dataDir, 'access.json');

if (!fs.existsSync(filesPath)) fs.writeFileSync(filesPath, JSON.stringify([]));
if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, JSON.stringify([]));
if (!fs.existsSync(accessPath)) fs.writeFileSync(accessPath, JSON.stringify({}));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Helper functions
function readFiles() {
  try {
    return JSON.parse(fs.readFileSync(filesPath, 'utf8'));
  } catch {
    return [];
  }
}

function writeFiles(data) {
  fs.writeFileSync(filesPath, JSON.stringify(data, null, 2));
}

function readAccess() {
  try {
    return JSON.parse(fs.readFileSync(accessPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeAccess(data) {
  fs.writeFileSync(accessPath, JSON.stringify(data, null, 2));
}

function getTotalSize() {
  let total = 0;
  if (fs.existsSync(uploadsDir)) {
    fs.readdirSync(uploadsDir).forEach(file => {
      total += fs.statSync(path.join(uploadsDir, file)).size;
    });
  }
  return total;
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function hasAccess(userId, fileId) {
  const access = readAccess();
  return access[fileId] && access[fileId].includes(userId);
}

// Routes

// Get all files (public view - names only)
app.get('/api/files', (req, res) => {
  const userId = req.query.userId || 'guest';
  const files = readFiles();
  const access = readAccess();

  const filesData = files.map(file => ({
    id: file.id,
    originalName: file.originalName,
    uploadDate: file.uploadDate,
    size: file.size,
    hasAccess: hasAccess(userId, file.id),
    locked: !hasAccess(userId, file.id)
  }));

  res.json(filesData);
});

// Search files
app.get('/api/search', (req, res) => {
  const query = req.query.q.toLowerCase();
  const userId = req.query.userId || 'guest';
  const files = readFiles();

  const results = files.filter(file => 
    file.originalName.toLowerCase().includes(query)
  ).map(file => ({
    id: file.id,
    originalName: file.originalName,
    uploadDate: file.uploadDate,
    size: file.size,
    hasAccess: hasAccess(userId, file.id),
    locked: !hasAccess(userId, file.id)
  }));

  res.json(results);
});

// Download file (only if user has access)
app.get('/api/download/:id', (req, res) => {
  const userId = req.query.userId || 'guest';
  const files = readFiles();
  const file = files.find(f => f.id === req.params.id);

  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!hasAccess(userId, req.params.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const filePath = path.join(uploadsDir, file.storageName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  res.download(filePath, file.originalName);
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: uuidv4() });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Admin: Upload file
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  const { adminToken } = req.body;
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized' });

  const files = readFiles();
  const newFile = {
    id: uuidv4(),
    originalName: req.file.originalname,
    storageName: req.file.filename,
    size: req.file.size,
    uploadDate: new Date().toISOString(),
    uploadedBy: 'admin'
  };

  files.push(newFile);
  writeFiles(files);

  res.json({ success: true, file: newFile });
});

// Admin: Delete file
app.delete('/api/admin/file/:id', (req, res) => {
  const { adminToken } = req.body;
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized' });

  const files = readFiles();
  const file = files.find(f => f.id === req.params.id);

  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(uploadsDir, file.storageName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  const updatedFiles = files.filter(f => f.id !== req.params.id);
  writeFiles(updatedFiles);

  // Remove access records
  const access = readAccess();
  delete access[req.params.id];
  writeAccess(access);

  res.json({ success: true });
});

// Admin: Rename file
app.put('/api/admin/file/:id', (req, res) => {
  const { adminToken, newName } = req.body;
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized' });

  const files = readFiles();
  const file = files.find(f => f.id === req.params.id);

  if (!file) return res.status(404).json({ error: 'File not found' });

  file.originalName = newName;
  writeFiles(files);

  res.json({ success: true, file });
});

// Admin: Grant access
app.post('/api/admin/grant-access', (req, res) => {
  const { adminToken, fileId, userId } = req.body;
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized' });

  const access = readAccess();
  if (!access[fileId]) access[fileId] = [];
  if (!access[fileId].includes(userId)) access[fileId].push(userId);
  writeAccess(access);

  res.json({ success: true });
});

// Admin: Revoke access
app.post('/api/admin/revoke-access', (req, res) => {
  const { adminToken, fileId, userId } = req.body;
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized' });

  const access = readAccess();
  if (access[fileId]) {
    access[fileId] = access[fileId].filter(u => u !== userId);
  }
  writeAccess(access);

  res.json({ success: true });
});

// Admin: Get dashboard data
app.get('/api/admin/dashboard', (req, res) => {
  const files = readFiles();
  const access = readAccess();
  const totalSize = getTotalSize();

  res.json({
    totalFiles: files.length,
    totalSize: formatFileSize(totalSize),
    totalSizeBytes: totalSize,
    files: files,
    accessRecords: access
  });
});

// Admin: Get file access details
app.get('/api/admin/file/:id/access', (req, res) => {
  const access = readAccess();
  const fileAccess = access[req.params.id] || [];
  res.json({ fileId: req.params.id, users: fileAccess });
});

// Server startup
app.listen(PORT, () => {
  console.log(`🚀 Ronak Drive running on http://localhost:${PORT}`);
  console.log(`📁 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
});