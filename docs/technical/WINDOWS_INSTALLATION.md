# Windows Installation Guide

## Complete Setup for Windows Development Environment

This guide provides step-by-step instructions for setting up and testing the Absence Management System on Windows.

---

## Prerequisites

### System Requirements
- Windows 10 or Windows 11
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Administrator access

### Required Software
- Node.js 16+ LTS
- PostgreSQL 12+
- Git for Windows (optional but recommended)
- Visual Studio Code (recommended for development)

---

## Part 1: Install Required Software

### Step 1: Install Node.js and npm

1. Visit https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer:
   - Accept the license agreement
   - Accept the default installation path (`C:\Program Files\nodejs\`)
   - Accept all features (npm should be included)
   - Accept additional dependencies
   - Click Install

4. **Verify installation** - Open Command Prompt or PowerShell:
   ```powershell
   node --version
   npm --version
   ```
   Expected output: v18.x.x or higher and version 9.x.x or higher

### Step 2: Install PostgreSQL

1. Visit https://www.postgresql.org/download/windows/
2. Download the latest version (14 or higher)
3. Run the installer:
   - Accept the installation directory (default is fine)
   - **Important**: Remember the superuser password
   - Accept port 5432 (default)
   - Accept default locale
   - Complete installation

4. **PostgreSQL should start automatically** after installation

### Step 3: Install Git (Optional but Recommended)

1. Visit https://git-scm.com/download/win
2. Download and run the installer
3. Accept all default settings
4. Complete installation

### Step 4: Verify PostgreSQL is Running

```powershell
# Open PowerShell and test connection
psql -U postgres -c "SELECT version();"

# If prompted for password, enter the password you set during installation
```

---

## Part 2: Clone and Setup Project

### Step 5: Clone the Repository

Using Command Prompt, PowerShell, or Git Bash:

```powershell
# Navigate to where you want the project (e.g., C:\Development)
cd C:\Development

# Clone the repository
git clone https://github.com/YOUR_REPO/Robotics-Program-Attendance.git
cd Robotics-Program-Attendance
```

Or download the ZIP file from the repository and extract it.

### Step 6: Create PostgreSQL User and Database

```powershell
# Connect to PostgreSQL as superuser
psql -U postgres

# In PostgreSQL prompt (you should see "postgres=#"), run:
CREATE USER robotics_user WITH PASSWORD 'your_secure_password';
ALTER ROLE robotics_user CREATEDB;
CREATE DATABASE robotics_attendance OWNER robotics_user;
GRANT ALL PRIVILEGES ON DATABASE robotics_attendance TO robotics_user;
\q
```

**Important**: 
- Replace `your_secure_password` with a strong password
- Save the password - you'll need it for environment configuration

### Step 7: Configure Environment Variables

#### Backend Configuration

1. Open file explorer and navigate to: `C:\Development\Robotics-Program-Attendance\backend`

2. Create a new file called `.env` (if it doesn't exist):
   - Right-click in the folder
   - Click "New" → "Text Document"
   - Rename to `.env` (Windows will ask if you want to change the extension, click Yes)

3. Open `.env` in Notepad or VS Code and add:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robotics_attendance
DB_USER=robotics_user
DB_PASSWORD=your_secure_password
DB_SSL=false

NODE_ENV=development
PORT=3000

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

TZ=America/Chicago
```

Replace `your_secure_password` with the password you set in Step 6.

#### Frontend Configuration

1. Navigate to: `C:\Development\Robotics-Program-Attendance\frontend`

2. Create or edit `.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Robotics Attendance System
```

### Step 8: Install Dependencies

Open PowerShell and navigate to the project root, then run:

```powershell
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

**Note**: This may take 2-5 minutes the first time.

---

## Part 3: Database Setup

### Step 9: Initialize Database Tables

```powershell
# From project root
cd backend
node scripts/createAbsenceTables.js
```

Expected output:
```
Creating core_hours table...
✓ core_hours table created
Creating absences table...
✓ absences table created
Creating absence_logs table...
✓ absence_logs table created
Creating indexes...
✓ Indexes created
✓ All tables created successfully!
```

### Step 10: Verify Database Creation

```powershell
psql -U robotics_user -d robotics_attendance -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema='public';"
```

You should see a list including:
- core_hours
- absences
- absence_logs
- (and existing tables)

---

## Part 4: Run the Application

### Step 11: Start Backend Server

Open **PowerShell** (or Command Prompt) and run:

```powershell
cd C:\Development\Robotics-Program-Attendance\backend
npm start
```

Expected output:
```
Server is running on port 3000
Connected to PostgreSQL database
```

**Keep this window open** - the backend is now running.

### Step 12: Start Frontend Development Server

Open a **new PowerShell** window and run:

```powershell
cd C:\Development\Robotics-Program-Attendance\frontend
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 13: Access the Application

1. Open your web browser
2. Navigate to: `http://localhost:5173`
3. You should see the Robotics Attendance System login page
4. Login with your mentor/coach credentials

---

## Part 5: Testing the System

### Step 14: Follow Testing Guide

Once logged in, follow the testing steps in `QUICK_START_TESTING.md`:

1. **Configure Core Hours** (Section: Step 4)
   - Navigate to "Core Hours Configuration"
   - Add schedule for Monday, Friday, Saturday

2. **Record Test Absence** (Section: Step 5)
   - Navigate to "Absence Management"
   - Record a new absence

3. **Approve Absence** (Section: Step 6)
   - Edit and approve the absence

4. **Generate Report** (Section: Step 7)
   - Navigate to "Reports & Analytics"
   - Generate and download reports

5. **Check Presence Board** (Section: Step 9)
   - Verify excused absences show in green

### Step 15: Verify All Features Work

- [ ] Can access login page
- [ ] Can navigate to all three new pages
- [ ] Can create core hours
- [ ] Can record absence
- [ ] Can approve absence
- [ ] Can view audit trail
- [ ] Can generate reports
- [ ] Can download CSV
- [ ] Can download audit report
- [ ] Presence board shows excused absences in green

---

## Troubleshooting on Windows

### Backend Won't Start

**Problem**: Backend service fails to start or crashes immediately

**Solutions**:
```powershell
# 1. Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill process using port (replace PID with the number shown above)
taskkill /PID <PID> /F

# 2. Reinstall dependencies
cd backend
rm -r node_modules
npm install

# 3. Clear npm cache
npm cache clean --force

# 4. Run again
npm start
```

### PostgreSQL Connection Error

**Problem**: "Cannot connect to database" error

**Solutions**:
```powershell
# 1. Verify PostgreSQL is running
# Check Windows Services: Press Win+R, type "services.msc"
# Look for "PostgreSQL" service and ensure it's running

# 2. Test PostgreSQL connection
psql -U robotics_user -d robotics_attendance

# 3. Verify .env file settings
cat backend/.env | Select-String "DB_"

# 4. Check database exists
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'robotics_attendance';"
```

### Port Already in Use

**Problem**: "Port 3000 already in use" or "Port 5173 already in use"

**Solution**:
```powershell
# Find what's using the port
netstat -ano | findstr :3000    # for port 3000
netstat -ano | findstr :5173    # for port 5173

# Kill the process
taskkill /PID <PID> /F

# Or use a different port (edit package.json or environment)
```

### npm install Fails

**Problem**: npm install throws errors

**Solutions**:
```powershell
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# 3. Reinstall
npm install

# 4. If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Database Tables Don't Exist

**Problem**: Tables not created or migration failed

**Solution**:
```powershell
# 1. Verify you're in the backend folder
cd backend

# 2. Run migration script again
node scripts/createAbsenceTables.js

# 3. If it fails, check database connection
psql -U robotics_user -d robotics_attendance

# 4. Check what tables exist
psql -U robotics_user -d robotics_attendance -c "\dt"
```

### Cannot Login

**Problem**: Login credentials don't work

**Solutions**:
```powershell
# 1. Make sure you're using mentor/coach account (not student)
# 2. Verify credentials are correct in database

psql -U robotics_user -d robotics_attendance
SELECT alias, first_name, role FROM users LIMIT 5;
\q

# 3. Check that you have the right role
# Should see role = 'mentor' or 'coach'
```

### Frontend Shows Errors

**Problem**: Browser console shows API errors or connection refused

**Solutions**:
1. **Verify backend is running**: Check terminal where you ran `npm start`
2. **Check browser console**: Press F12 → Console tab to see actual error
3. **Verify API URL**: Check that `.env.local` has correct `VITE_API_URL`
4. **Check network tab**: F12 → Network tab to see failed requests

---

## Development Tips for Windows

### VS Code Integration

1. Download and install Visual Studio Code from https://code.visualstudio.com/

2. Open the project:
   ```powershell
   code C:\Development\Robotics-Program-Attendance
   ```

3. Install recommended extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - PostgreSQL extension
   - Thunder Client (for API testing)

### Using VS Code Terminal

Instead of opening separate PowerShell windows:

1. Open VS Code
2. View → Terminal (or Ctrl+`)
3. Create new terminals for backend and frontend

### Hot Reload Development

- **Backend**: Automatically restarts on file changes (if using nodemon)
- **Frontend**: Automatically reloads in browser when you save files

### Database Management

Install pgAdmin for easy database management:
1. Visit https://www.pgadmin.org/
2. Download pgAdmin 4 (Windows installer)
3. Run installer and follow setup wizard
4. Access at http://localhost:5050

---

## Daily Development Workflow

### Starting Development Session

```powershell
# Terminal 1: Backend
cd C:\Development\Robotics-Program-Attendance\backend
npm start

# Terminal 2: Frontend (new PowerShell window)
cd C:\Development\Robotics-Program-Attendance\frontend
npm run dev

# Then open browser to http://localhost:5173
```

### Stopping Development Session

```powershell
# In each PowerShell window:
Ctrl+C    # Stops the running process
```

### Checking Logs

- **Backend logs**: Shown in Terminal 1 where you ran `npm start`
- **Frontend logs**: Shown in Terminal 2 where you ran `npm run dev`
- **Browser console**: Press F12 in browser → Console tab

---

## Building for Production (Windows)

When ready to deploy to Ubuntu server:

```powershell
# Build frontend for production
cd frontend
npm run build

# The dist/ folder contains your optimized frontend build
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm start` |
| Start frontend | `cd frontend && npm run dev` |
| Access app | `http://localhost:5173` |
| Create test absence | Via web UI under "Absence Management" |
| View logs | Check terminal windows where services are running |
| Stop services | `Ctrl+C` in each terminal |
| Check PostgreSQL | `psql -U robotics_user -d robotics_attendance` |

---

## Stopping and Restarting Services

```powershell
# Stop all services
# Ctrl+C in each terminal window

# Restart backend
cd C:\Development\Robotics-Program-Attendance\backend
npm start

# Restart frontend (in separate terminal)
cd C:\Development\Robotics-Program-Attendance\frontend
npm run dev
```

---

## Next Steps After Installation

1. ✅ **Database created** - Check Part 3, Step 10
2. ✅ **Services running** - Check Part 4, Steps 11-12
3. ✅ **Application accessible** - Check Part 4, Step 13
4. **Run tests** - Follow Part 5, Steps 14-15
5. **Configure core hours** - Follow QUICK_START_TESTING.md Section 4
6. **Test all features** - Follow QUICK_START_TESTING.md Sections 5-10

---

**Windows Installation Complete!**

You're now ready to test the system on your Windows machine.
