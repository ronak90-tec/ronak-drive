// Global variables
let adminToken = null;
let darkMode = localStorage.getItem('darkMode') === 'true';
let currentFileId = null;
const ADMIN_PASSWORD = 'ronak2326';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (darkMode) document.body.classList.add('dark-mode');
  setupEventListeners();
  
  const savedToken = sessionStorage.getItem('adminToken');
  if (savedToken) {
    adminToken = savedToken;
    showDashboard();
  }
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Upload
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());
  uploadArea.addEventListener('dragover', (e) => e.preventDefault());
  uploadArea.addEventListener('drop', handleFileDrop);
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);
  
  // Modal close
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });
  
  // Access modal
  document.getElementById('grantAccessBtn').addEventListener('click', grantAccess);
  document.getElementById('confirmRenameBtn').addEventListener('click', confirmRename);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const loginError = document.getElementById('loginError');
  
  if (password === ADMIN_PASSWORD) {
    // Generate token
    adminToken = 'token-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('adminToken', adminToken);
    
    document.getElementById('loginForm').reset();
    loginError.textContent = '';
    showDashboard();
  } else {
    loginError.textContent = 'Invalid password!';
  }
}

// Show dashboard
function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  loadDashboard();
}

// Load dashboard
async function loadDashboard() {
  try {
    const response = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await response.json();
    
    document.getElementById('dashTotalFiles').textContent = data.totalFiles;
    document.getElementById('dashStorageUsed').textContent = data.totalSize;
    
    loadFilesTable(data.files, data.accessRecords);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Load files table
function loadFilesTable(files, accessRecords) {
  const tbody = document.getElementById('filesTableBody');
  
  if (files.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No files uploaded yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = files.map(file => `
    <tr>
      <td>${file.originalName}</td>
      <td>${formatFileSize(file.size)}</td>
      <td>${new Date(file.uploadDate).toLocaleDateString()}</td>
      <td><span>${(accessRecords[file.id] || []).length}</span> users</td>
      <td>
        <button class="btn btn-primary" style="padding: 5px 10px;" onclick="manageAccess('${file.id}', '${file.originalName.replace(/'/g, "\\'")}')">Access</button>
        <button class="btn btn-secondary" style="padding: 5px 10px;" onclick="renameFile('${file.id}', '${file.originalName.replace(/'/g, "\\'")}')">Rename</button>
        <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteFile('${file.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Handle file drop
function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const files = e.dataTransfer.files;
  uploadFile(files[0]);
}

// Handle file select
function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) uploadFile(files[0]);
}

// Upload file
async function uploadFile(file) {
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('adminToken', adminToken);
  
  const uploadProgress = document.getElementById('uploadProgress');
  uploadProgress.style.display = 'block';
  
  try {
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('File uploaded successfully!', 'success');
      loadDashboard();
    } else {
      showMessage('Upload failed!', 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showMessage('Upload error!', 'error');
  }
  
  uploadProgress.style.display = 'none';
}

// Delete file
async function deleteFile(fileId) {
  if (!confirm('Are you sure you want to delete this file?')) return;
  
  try {
    const response = await fetch(`/api/admin/file/${fileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken })
    });
    
    if (response.ok) {
      showMessage('File deleted successfully!', 'success');
      loadDashboard();
    } else {
      showMessage('Delete failed!', 'error');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showMessage('Delete error!', 'error');
  }
}

// Rename file
function renameFile(fileId, currentName) {
  currentFileId = fileId;
  document.getElementById('newFileName').value = currentName;
  document.getElementById('renameModal').classList.add('show');
}

// Confirm rename
async function confirmRename() {
  const newName = document.getElementById('newFileName').value;
  if (!newName.trim()) return;
  
  try {
    const response = await fetch(`/api/admin/file/${currentFileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, newName })
    });
    
    if (response.ok) {
      showMessage('File renamed successfully!', 'success');
      closeAllModals();
      loadDashboard();
    }
  } catch (error) {
    console.error('Rename error:', error);
    showMessage('Rename error!', 'error');
  }
}

// Manage access
function manageAccess(fileId, fileName) {
  currentFileId = fileId;
  document.getElementById('accessModalFileName').textContent = fileName;
  
  // Load access list
  fetch(`/api/admin/file/${fileId}/access`)
    .then(r => r.json())
    .then(data => {
      const accessList = document.getElementById('accessList');
      accessList.innerHTML = data.users.length === 0 ? '<li>No users with access</li>' : 
        data.users.map(user => `
          <li>
            ${user}
            <button onclick="revokeAccess('${user}')">Revoke</button>
          </li>
        `).join('');
      
      document.getElementById('accessModal').classList.add('show');
    });
}

// Grant access
async function grantAccess() {
  const userId = document.getElementById('userIdInput').value.trim();
  if (!userId) {
    alert('Please enter a User ID');
    return;
  }
  
  try {
    const response = await fetch('/api/admin/grant-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminToken,
        fileId: currentFileId,
        userId
      })
    });
    
    if (response.ok) {
      document.getElementById('userIdInput').value = '';
      showMessage('Access granted!', 'success');
      manageAccess(currentFileId, document.getElementById('accessModalFileName').textContent);
    }
  } catch (error) {
    console.error('Grant access error:', error);
  }
}

// Revoke access
async function revokeAccess(userId) {
  if (!confirm('Revoke access for this user?')) return;
  
  try {
    const response = await fetch('/api/admin/revoke-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminToken,
        fileId: currentFileId,
        userId
      })
    });
    
    if (response.ok) {
      showMessage('Access revoked!', 'success');
      manageAccess(currentFileId, document.getElementById('accessModalFileName').textContent);
    }
  } catch (error) {
    console.error('Revoke access error:', error);
  }
}

// Logout
function logout() {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').textContent = '';
}

// Close all modals
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('show');
  });
}

// Show message
function showMessage(message, type) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.textContent = message;
  statusDiv.className = `message show ${type}`;
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

// Toggle dark mode
function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  document.body.classList.toggle('dark-mode', darkMode);
}

// Helper functions
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}