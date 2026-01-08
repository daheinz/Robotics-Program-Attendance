# Windows Update Guide - Absence Management Features

## Updating Your Existing Robotics Attendance System on Windows

This guide covers updating your existing Windows installation with the new Absence Management features.

---

## Prerequisites

✅ **You should already have:**
- Existing Robotics Attendance System running on Windows
- Node.js and npm installed
- PostgreSQL installed and running
- Backend and frontend already configured

---

## Update Process Overview

```
1. Stop running services (2 min)
2. Pull latest code from repository (2 min)
3. Install new dependencies (5 min)
4. Run database migration (2 min)
5. Restart services (2 min)
6. Verify new features (10 min)
```

**Total Time**: ~20-30 minutes

---

## Step-by-Step Update Instructions

### Step 1: Stop Running Services

If your backend and frontend are currently running, stop them:

```powershell
# In each PowerShell terminal window where services are running
# Press Ctrl+C to stop the service
```

Or close the terminal windows running the services.

### Step 2: Backup Current Database (Recommended)

```powershell
# Create backup directory if it doesn't exist
mkdir C:\Development\Backups -ErrorAction SilentlyContinue

# Backup database
$date = Get-Date -Format "yyyyMMdd_HHmmss"; mkdir "C:\Development\backups" -Force; & "C:\Program Files\PostgreSQL\18\bin\pg_dump" -U attendance_user -d attendance > "C:\Development\backups\attendance_backup_$date.sql"
```

**Save this backup!** You can restore if anything goes wrong.

### Step 3: Pull Latest Code

```powershell
# Navigate to project directory
cd C:\Development\Robotics-Program-Attendance

# Stash any local changes (if needed)
git stash

# Pull latest changes
git pull origin main

# Or if using a different branch
git pull origin <your-branch-name>
```

### Step 4: Install New Dependencies

```powershell
# Update backend dependencies
cd backend
npm install
cd ..

# Update frontend dependencies
cd frontend
npm install
cd ..
```

**Expected**: New packages for absence management will be installed (if any were added).

### Step 5: Run Database Migration for Absence Tables

This creates the three new tables: `core_hours`, `absences`, `absence_logs`

```powershell
# From project root
cd backend
node scripts/createAbsenceTables.js
```

**Expected Output**:
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

**If tables already exist**: Script will show errors - this is OK if you already ran it.

#### Run Database Migration for Presence Timeline Window (NEW)

Adds configurable timeline start/end hours to `system_settings` used by Presence Board.

```powershell
# From project root
cd backend
node scripts/addPresenceHours.js
```

**Expected Output**:
```
Adding presence window columns to system_settings...
✓ Presence window columns added/verified successfully
```

### Step 6: Verify Database Tables Created

```powershell
# List all tables to confirm new ones exist
psql -U attendance_user -d attendance -c "\dt"
```

**You should see**:
- `core_hours` (NEW)
- `absences` (NEW)
- `absence_logs` (NEW)
- Plus all your existing tables (users, attendance_sessions, etc.)

### Step 7: Restart Backend Service

Open a **new PowerShell window**:

```powershell
cd C:\Development\Robotics-Program-Attendance\backend
npm start
```

**Expected Output**:
```
Server is running on port 3000
Connected to PostgreSQL database
```

### Step 8: Restart Frontend Service

Open **another new PowerShell window**:

```powershell
cd C:\Development\Robotics-Program-Attendance\frontend
npm run dev
```

**Expected Output**:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 9: Verify Update in Browser

1. **Open browser** → `http://localhost:5173`

2. **Login** with mentor/coach credentials

3. **Check for new menu items** on dashboard:
   - ⏰ Core Hours Configuration
   - 📋 Absence Management  
   - 📊 Reports & Analytics

4. **Click each new page** to verify they load without errors

---

## Verification Checklist

After update, verify all new features work:

### ✅ New Pages Load
- [ ] Can access "Core Hours Configuration" page
- [ ] Can access "Absence Management" page
- [ ] Can access "Reports & Analytics" page
- [ ] Presence Board still works (existing feature)

### ✅ Core Hours Functionality
- [ ] Can add new core hours entry
- [ ] Can edit existing core hours
- [ ] Can delete core hours
- [ ] Can switch between Build/Offseason

### ✅ Absence Management Functionality
- [ ] Can record new absence
- [ ] Can view unapproved absences
- [ ] Can approve absence
- [ ] Can edit approved absence
- [ ] Can view audit trail
- [ ] Absence list shows student names correctly

### ✅ Reporting Functionality
- [ ] Can select date range
- [ ] Can view attendance summary
- [ ] Can download CSV report
- [ ] Can download audit report
- [ ] Can view future absences

### ✅ Integration with Existing Features
- [ ] Existing login still works
- [ ] Existing check-in/out still works
- [ ] Presence Board shows excused absences in green
- [ ] Student Dashboard still accessible
- [ ] Admin Dashboard still accessible

---

## Troubleshooting Update Issues

### Issue: "Table already exists" error during migration

**This is normal** if you already ran the migration before.

**Verify tables exist**:
```powershell
psql -U robotics_user -d robotics_attendance -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('core_hours', 'absences', 'absence_logs');"
```

If you see all three tables, the migration already ran successfully.

### Issue: New pages show "404 Not Found"

**Solution**: Clear browser cache or hard refresh

```
In browser: Ctrl+Shift+R (hard refresh)
Or: Ctrl+Shift+Delete → Clear cached images and files
```

**Then verify frontend rebuilt**:
```powershell
cd frontend
npm run dev
```

### Issue: Backend shows errors about missing routes

**Solution**: Make sure you pulled all code changes

```powershell
cd C:\Development\Robotics-Program-Attendance
git status  # Check if on correct branch
git pull    # Pull latest changes
cd backend
npm install # Reinstall dependencies
npm start   # Restart backend
```

### Issue: "Module not found" errors

**Solution**: Reinstall dependencies

```powershell
# Backend
cd backend
rm -r node_modules
rm package-lock.json
npm install

# Frontend
cd ../frontend
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: New menu items don't appear on dashboard

**Possible causes**:
1. **Not logged in as mentor/coach** - Student accounts won't see these features
2. **Frontend didn't update** - Hard refresh browser (Ctrl+Shift+R)
3. **App.jsx didn't update** - Verify code was pulled correctly

**Verify**:
```powershell
# Check if App.jsx has new routes
Select-String -Path "frontend\src\App.jsx" -Pattern "core-hours|absences|reports"
```

Should show matches if code updated correctly.

### Issue: Database connection fails after update

**Solution**: Verify .env file wasn't changed

```powershell
# Check database connection settings
cat backend\.env | Select-String "DB_"
```

Should still have your original database credentials.

### Issue: Port already in use

**Solution**: Something is already using port 3000 or 5173

```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace <PID> with number shown)
taskkill /PID <PID> /F

# Restart service
cd backend
npm start
```

---

## Rollback Procedure (If Update Fails)

If the update causes major issues:

### Step 1: Stop Services

```powershell
# Press Ctrl+C in both terminal windows
```

### Step 2: Restore Database Backup

```powershell
# Find your backup
ls C:\Development\Backups\

# Restore (replace filename with your backup)
psql -U robotics_user -d robotics_attendance < C:\Development\Backups\robotics_attendance_YYYYMMDD_HHMMSS.sql
```

### Step 3: Revert Code Changes

```powershell
cd C:\Development\Robotics-Program-Attendance
git log  # Find commit hash before update
git reset --hard <commit-hash>
```

### Step 4: Restart Services

```powershell
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

---

## What Changed in This Update

### New Backend Files
```
backend/models/
├── CoreHours.js           (NEW)
└── Absence.js             (NEW)

backend/controllers/
├── coreHoursController.js (NEW)
├── absenceController.js   (NEW)
└── reportController.js    (NEW)

backend/routes/
├── coreHours.js           (NEW)
├── absences.js            (NEW)
└── reports.js             (NEW)

backend/scripts/
└── createAbsenceTables.js (NEW - migration script)
```

### Modified Backend Files
```
backend/server.js          (UPDATED - new routes added)
```

### New Frontend Files
```
frontend/src/pages/
├── CoreHoursConfig.jsx    (NEW)
├── CoreHoursConfig.css    (NEW)
├── AbsenceManagement.jsx  (NEW)
├── AbsenceManagement.css  (NEW)
├── ReportingPage.jsx      (NEW)
└── ReportingPage.css      (NEW)
```

### Modified Frontend Files
```
frontend/src/App.jsx              (UPDATED - new routes added)
frontend/src/pages/PresenceBoard.jsx  (UPDATED - shows excused absences)
frontend/src/pages/PresenceBoard.css  (UPDATED - green styling)
```

### New Database Tables
```
core_hours        (Stores required/suggested attendance times)
absences          (Tracks approved/unapproved absences)
absence_logs      (Complete audit trail of all changes)
```

---

## Post-Update Configuration

### Initial Setup After Update

Once update is complete and verified:

#### 1. Configure Core Hours for Your Team

```
Login as mentor/coach
→ Navigate to "Core Hours Configuration"
→ Select season type (Build or Offseason)
→ Add your team's schedule:

Example Build Season:
- Monday: 5:30 PM - 8:00 PM (Required)
- Friday: 3:30 PM - 8:30 PM (Required)
- Saturday: 10:00 AM - 4:00 PM (Required)
```

#### 2. Test Absence Recording

```
→ Navigate to "Absence Management"
→ Click "Record New Absence"
→ Select a student
→ Select a future date
→ Enter notes
→ Choose Approved/Unapproved
→ Save
```

#### 3. Test Reporting

```
→ Navigate to "Reports & Analytics"
→ Select date range
→ Click "View Summary"
→ Try "Download CSV"
→ Try "Download Audit Report"
```

---

## Quick Reference: Updated Commands

```powershell
# Stop services
Ctrl+C in each terminal

# Update code
cd C:\Development\Robotics-Program-Attendance
git pull

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Run database migration
cd backend
node scripts/createAbsenceTables.js
node scripts/addPresenceHours.js

# Start backend
cd backend
npm start

# Start frontend (new terminal)
cd frontend
npm run dev

# Access application
# Open browser → http://localhost:5173
```

---

## Need Help?

**Documentation for new features**:
- Feature guide: `docs/guides/ABSENCE_MANAGEMENT_GUIDE.md`
- Testing guide: `docs/guides/QUICK_START_TESTING.md`
- Examples: `docs/examples/CONFIG_EXAMPLES.md`

**Common issues**:
- Check `WINDOWS_INSTALLATION.md` troubleshooting section
- Review error messages in PowerShell terminals
- Check browser console (F12) for frontend errors

---

## Update Verification Complete ✅

If all checklist items pass:
- ✅ New features are working
- ✅ Existing features still work
- ✅ No errors in console
- ✅ Database migration successful

**Your system is successfully updated!**

---

**Update completed**: January 6, 2026
**Features added**: Absence Management, Core Hours Configuration, Reporting & Analytics
**Database changes**: 3 new tables, 5 new indexes
