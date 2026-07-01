// Global variables
let currentUserId = localStorage.getItem('userId') || 'guest-' + Math.random().toString(36).substr(2, 9);
let selectedFileId = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  localStorage.setItem('userId', currentUserId);
  if (darkMode) document.body.classList.add('dark-mode');
  
  loadFiles();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('searchBtn').addEventListener('click', searchFiles);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchFiles();
  });
  
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  
  document.querySelector('.close-modal').addEventListener('click', closeModal);
  document.getElementById('fileModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('fileModal')) closeModal();
  });
  
  document.getElementById('downloadBtn').addEventListener('click', downloadFile);
  document.getElementById('requestAccessBtn').addEventListener('click', requestAccess);
}

// Load all files
async function loadFiles() {
  try {
    const response = await fetch(`/api/files?userId=${currentUserId}`);
    const files = await response.json();
    
    displayFiles(files);
    updateStats(files);
  } catch (error) {
    console.error('Error loading files:', error);
    document.getElementById('filesList').innerHTML = '<div class="loading"><p>Error loading files</p></div>';
  }
}

// Display files
function displayFiles(files) {
  const filesList = document.getElementById('filesList');
  
  if (files.length === 0) {
    filesList.innerHTML = '<div class="loading"><p>No files available</p></div>';
    return;
  }
  
  filesList.innerHTML = files.map(file => `
    <div class="file-card">
      <div class="file-card-header">
        <div class="file-icon">${getFileIcon(file.originalName)}</div>
        <div class="file-status">
          ${file.locked ? '<i class="fas fa-lock lock-icon"></i>' : '<i class="fas fa-unlock" style="color: var(--success);"></i>'}
        </div>
      </div>
      <div class="file-card-body">
        <div class="file-name">${file.originalName}</div>
        <div class="file-info">📦 ${formatFileSize(file.size)}</div>
        <div class="file-info">📅 ${new Date(file.uploadDate).toLocaleDateString()}</div>
        <div class="file-info">Access: ${file.hasAccess ? '✅ Allowed' : '🔒 Locked'}</div>
      </div>
      <div class="file-actions">
        <button class="btn btn-primary" onclick="openFileModal('${file.id}')">View</button>
        ${file.hasAccess ? `<button class="btn btn-success" onclick="downloadFile('${file.id}')"><i class="fas fa-download"></i></button>` : ''}
      </div>
    </div>
  `).join('');
}

// Update stats
function updateStats(files) {
  const locked = files.filter(f => f.locked).length;
  const access = files.filter(f => f.hasAccess).length;
  
  document.getElementById('fileCount').textContent = files.length;
  document.getElementById('lockedCount').textContent = locked;
  document.getElementById('accessCount').textContent = access;
}

// Open file modal
function openFileModal(fileId) {
  selectedFileId = fileId;
  fetch(`/api/files?userId=${currentUserId}`)
    .then(r => r.json())
    .then(files => {
      const file = files.find(f => f.id === fileId);
      if (file) {
        document.getElementById('modalFileName').textContent = file.originalName;
        document.getElementById('modalFileSize').textContent = formatFileSize(file.size);
        document.getElementById('modalFileDate').textContent = new Date(file.uploadDate).toLocaleString();
        
        const accessStatus = document.getElementById('accessStatus');
        const downloadBtn = document.getElementById('downloadBtn');
        const requestBtn = document.getElementById('requestAccessBtn');
        
        if (file.hasAccess) {
          accessStatus.innerHTML = '<span style="color: var(--success);">✅ You have access to this file</span>';
          downloadBtn.style.display = 'inline-block';
          requestBtn.style.display = 'none';
        } else {
          accessStatus.innerHTML = '<span style="color: var(--danger);">🔒 You don\'t have access to this file</span>';
          downloadBtn.style.display = 'none';
          requestBtn.style.display = 'inline-block';
        }
        
        document.getElementById('fileModal').classList.add('show');
      }
    });
}

// Close modal
function closeModal() {
  document.getElementById('fileModal').classList.remove('show');
}

// Download file
function downloadFile(fileId = selectedFileId) {
  window.location.href = `/api/download/${fileId}?userId=${currentUserId}`;
}

// Request access
function requestAccess() {
  alert('Access request sent to admin.\nYour User ID: ' + currentUserId + '\nFile ID: ' + selectedFileId);
}

// Search files
async function searchFiles() {
  const query = document.getElementById('searchInput').value;
  if (!query.trim()) {
    loadFiles();
    return;
  }
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&userId=${currentUserId}`);
    const files = await response.json();
    displayFiles(files);
    updateStats(files);
  } catch (error) {
    console.error('Error searching files:', error);
  }
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

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    'pdf': '📄',
    'docx': '📝',
    'doc': '📝',
    'txt': '📄',
    'zip': '🗜️',
    'rar': '🗜️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'mp4': '🎥',
    'avi': '🎥',
    'mp3': '🎵',
    'wav': '🎵',
    'xlsx': '📊',
    'xls': '📊',
    'ppt': '📊',
    'pptx': '📊'
  };
  return icons[ext] || '📦';
}