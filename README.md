# 🔐 Ronak Drive - Secure File Management System

A complete file management system with admin panel, user access control, and cloud storage.

## ✨ Features

✅ **Admin Login** (Password: ronak2326)
✅ **File Upload** (PDF, DOCX, ZIP, Images, Videos, etc.)
✅ **File Manager** - Upload, Download, Delete, Rename
✅ **Access Control** - Admin controls who can access files
✅ **Search Functionality** - Find files quickly
✅ **Dashboard** - Storage usage & statistics
✅ **Dark Mode** - Night-friendly UI
✅ **Responsive Design** - Works on all devices
✅ **Render Deployment** - Ready to deploy

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: Multer (File uploads), File System
- **Database**: JSON files (Simple & lightweight)
- **Hosting**: Render.com

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Local Installation

```bash
# Clone repository
git clone https://github.com/ronak90-tec/ronak-drive.git
cd ronak-drive

# Install dependencies
npm install

# Create .env file (optional, defaults are set)
echo "ADMIN_PASSWORD=ronak2326" > .env
echo "PORT=5000" >> .env

# Start server
npm start
```

### Access the Application

- **User Dashboard**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin.html

### Default Admin Credentials
- **Password**: ronak2326

## 📁 Project Structure

```
ronak-drive/
├── server.js                 # Main backend server
├── package.json              # Dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── render.yaml              # Render deployment config
├── public/
│   ├── index.html           # User dashboard
│   ├── admin.html           # Admin panel
│   ├── css/
│   │   └── style.css        # Global styles + dark mode
│   └── js/
│       ├── app.js           # User dashboard logic
│       └── admin.js         # Admin panel logic
├── uploads/                 # Uploaded files (gitignored)
├── data/                    # JSON data files (gitignored)
│   ├── files.json          # File metadata
│   ├── access.json         # Access control records
│   └── users.json          # User records
└── README.md               # This file
```

## 👥 How to Use

### For Regular Users

1. Visit the public dashboard
2. Browse available files (names only)
3. Files show **🔒 lock icon** if you don't have access
4. Click **View** to see file details
5. If you have access, click **Download** to download
6. Use **Search** to find specific files
7. Toggle **Dark Mode** (🌙) for better night viewing

### For Admin

1. Go to: http://localhost:5000/admin.html
2. Enter password: `ronak2326`
3. **Upload Files**: Drag & drop or click to upload
4. **Manage Files**: 
   - **Delete**: Remove files permanently
   - **Rename**: Change file names
   - **Manage Access**: Grant/revoke user access
5. **View Dashboard**: See total files and storage used
6. **Logout**: Click logout when done

## 🔐 Access Control System

### How it Works:

1. **User ID**: Every user gets a unique ID on first visit
2. **Admin Panel**: Admin can grant access to specific users
3. **File Locking**: Users without access see only file names
4. **Download**: Only accessible files can be downloaded
5. **Request Access**: Users can request access (shows their User ID)

### Example:

```
User ID: guest-a1b2c3d4e5f6

File: important_document.pdf
- User can see: name, size, upload date
- User cannot: open or download
- User can: click "Request Access" with their User ID

Admin grants access to User ID: guest-a1b2c3d4e5f6
- User can now: download the file
```

## 📊 API Endpoints

### Public Endpoints

```
GET  /api/files?userId=<id>           - Get all files
GET  /api/search?q=<query>            - Search files
GET  /api/download/:id?userId=<id>   - Download file (needs access)
```

### Admin Endpoints

```
POST /api/admin/login                 - Admin login
POST /api/admin/upload                - Upload file
GET  /api/admin/dashboard             - Get dashboard data
DELETE /api/admin/file/:id            - Delete file
PUT  /api/admin/file/:id              - Rename file
POST /api/admin/grant-access          - Grant user access
POST /api/admin/revoke-access         - Revoke user access
GET  /api/admin/file/:id/access       - Get file access list
```

## 🌍 Deployment on Render

### Step-by-Step:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select this repository

3. **Configure**
   - **Name**: ronak-drive
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Disk**: Add 10GB persistent disk for uploads

4. **Environment Variables**
   - `PORT`: 5000
   - `ADMIN_PASSWORD`: ronak2326
   - `NODE_ENV`: production

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-5 minutes)
   - Your live URL: `https://ronak-drive-xxxx.onrender.com`

### Live URL Format
```
https://ronak-drive-[random].onrender.com
```

## 🎨 Customization

### Change Admin Password

Edit `.env` or environment variables:
```
ADMIN_PASSWORD=your_new_password
```

### Change Port

```
PORT=3000
```

### Customize Colors

Edit `public/css/style.css` - Look for `:root` variables:
```css
:root {
  --primary: #6366f1;        /* Main blue color */
  --secondary: #ec4899;      /* Pink accent */
  --success: #10b981;        /* Green */
  --danger: #ef4444;         /* Red */
}
```

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1920px)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)
- ✅ Dark Mode on all devices

## 🔒 Security Features

- ✅ Password-protected admin panel
- ✅ User-based access control
- ✅ File type validation
- ✅ Secure file uploads (Multer)
- ✅ Unique file names to prevent conflicts
- ✅ Session-based admin authentication

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use a different port
PORT=3001 npm start
```

### Uploads Directory Error
- The app creates `uploads/` and `data/` directories automatically
- If error persists, create them manually:
```bash
mkdir uploads data
```

### Files Not Saving
- Check write permissions in the project directory
- Ensure `uploads/` and `data/` folders exist
- Check disk space on the server

## 📞 Support

- **Email**: shuklaronak19@gmail.com
- **GitHub**: https://github.com/ronak90-tec

## 📝 License

MIT License - Free to use and modify

## 🎉 Credits

Created by **Ronak** with ❤️

---

**Happy file managing! 🚀**