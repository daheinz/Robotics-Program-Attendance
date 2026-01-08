# Ubuntu Server Update Guide - Absence Management Features

## Updating Your Existing Robotics Attendance System on Ubuntu Server

This guide covers updating your existing Ubuntu production server with the new Absence Management features.

---

## Prerequisites

✅ **You should already have:**
- Existing Robotics Attendance System running on Ubuntu server
- Node.js, npm, and PostgreSQL installed
- Backend and frontend services running (likely via systemd)
- SSH access to your server

---

## Update Process Overview

```
1. SSH into server and backup database (5 min)
2. Stop services (2 min)
3. Pull latest code (2 min)
4. Install new dependencies (5 min)
5. Run database migration (2 min)
6. Restart services (2 min)
7. Verify update (10 min)
```

**Total Time**: ~30 minutes

---

## Step-by-Step Update Instructions

### Step 1: SSH Into Server

```bash
ssh your-user@your-server-ip
```

Or using SSH key:
```bash
ssh -i ~/.ssh/your-key.pem your-user@your-server-ip
```

### Step 2: Backup Current Database (CRITICAL)

```bash
# Create backup directory
sudo mkdir -p /opt/backups

# Create timestamped backup
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump robotics_attendance | gzip > "/opt/backups/robotics_attendance_pre_update_$DATE.sql.gz"

# Verify backup was created
ls -lh /opt/backups/

# Copy backup to safe location (recommended)
# scp /opt/backups/robotics_attendance_pre_update_*.sql.gz user@backup-server:/backups/
```

**IMPORTANT**: Save this backup before proceeding!

### Step 3: Stop Running Services

```bash
# Stop backend service
sudo systemctl stop robotics-backend.service

# Stop frontend service (if running)
sudo systemctl stop robotics-frontend.service

# Verify services stopped
sudo systemctl status robotics-backend.service
sudo systemctl status robotics-frontend.service
```

### Step 4: Navigate to Project Directory

```bash
cd /opt/Robotics-Program-Attendance
```

Or wherever your installation is located. Check with:
```bash
sudo systemctl status robotics-backend.service | grep WorkingDirectory
```

### Step 5: Stash Local Changes (If Any)

```bash
# Check current status
git status

# Stash any local changes
git stash

# Or if you have local modifications you want to keep
git stash save "Local changes before absence feature update"
```

### Step 6: Pull Latest Code

```bash
# Pull from main branch
sudo git pull origin main

# Or from your specific branch
sudo git pull origin <your-branch>

# Verify update
git log -1
```

### Step 7: Install New Dependencies

```bash
# Update backend dependencies
cd backend
sudo npm install

# Update frontend dependencies
cd ../frontend
sudo npm install

# Return to project root
cd ..
```

### Step 8: Run Database Migration

This creates the three new tables: `core_hours`, `absences`, `absence_logs`

```bash
cd backend
sudo -u postgres node scripts/createAbsenceTables.js
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

**Note**: If you see "table already exists" errors, the migration already ran.

### Step 9: Verify Database Tables

```bash
sudo -u postgres psql -d robotics_attendance -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema='public' 
  AND table_name IN ('core_hours', 'absences', 'absence_logs');"
```

**You should see**:
```
   table_name
-----------------
 core_hours
 absences
 absence_logs
(3 rows)
```

### Step 10: Fix File Permissions (If Needed)

```bash
# Ensure correct ownership
sudo chown -R ubuntu:ubuntu /opt/Robotics-Program-Attendance

# Or use your specific user
sudo chown -R $USER:$USER /opt/Robotics-Program-Attendance
```

### Step 11: Restart Services

```bash
# Reload systemd (if service files changed)
sudo systemctl daemon-reload

# Start backend service
sudo systemctl start robotics-backend.service

# Start frontend service
sudo systemctl start robotics-frontend.service

# Check status
sudo systemctl status robotics-backend.service
sudo systemctl status robotics-frontend.service
```

### Step 12: Verify Services Are Running

```bash
# Check if backend is listening on port 3000
sudo netstat -tlnp | grep :3000

# Or using ss (modern systems)
sudo ss -tlnp | grep :3000

# Check if frontend is running (port 5173 or 4173)
sudo ss -tlnp | grep :5173

# Check nginx is running
sudo systemctl status nginx
```

### Step 13: Check Service Logs

```bash
# Backend logs
sudo journalctl -u robotics-backend.service -n 50 -f

# Press Ctrl+C to exit

# Frontend logs
sudo journalctl -u robotics-frontend.service -n 50

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

**Look for**: No errors, services started successfully.

---

## Verification After Update

### Test from Command Line

```bash
# Test backend API health
curl http://localhost:3000/health

# Test if new absence routes exist
curl http://localhost:3000/api/core-hours

# Test reports endpoint
curl http://localhost:3000/api/reports/future
```

### Test in Browser

1. **Open browser** → Navigate to your domain or server IP

2. **Login** as mentor/coach

3. **Verify new menu items** appear:
   - ⏰ Core Hours Configuration
   - 📋 Absence Management
   - 📊 Reports & Analytics

4. **Click each page** to verify they load

---

## Verification Checklist

### ✅ System Status
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Nginx service running
- [ ] No errors in journalctl logs
- [ ] Ports 3000, 5173 listening

### ✅ Database
- [ ] Tables created: core_hours, absences, absence_logs
- [ ] Indexes created successfully
- [ ] Existing data intact
- [ ] Can query new tables

### ✅ New Features Accessible
- [ ] Core Hours Configuration page loads
- [ ] Absence Management page loads
- [ ] Reports & Analytics page loads
- [ ] No 404 errors on new routes

### ✅ Existing Features Still Work
- [ ] Login works
- [ ] Student Dashboard accessible
- [ ] Admin Dashboard accessible
- [ ] Check-in/out functionality works
- [ ] Presence Board displays

### ✅ New Functionality Works
- [ ] Can create core hours entry
- [ ] Can record absence
- [ ] Can approve absence
- [ ] Can view reports
- [ ] Can download CSV
- [ ] Presence Board shows excused absences in green

---

## Troubleshooting Update Issues

### Issue: Service fails to start after update

**Check logs**:
```bash
sudo journalctl -u robotics-backend.service -n 100
```

**Common causes**:
1. **Missing dependencies**: Run `sudo npm install` in backend/
2. **Port conflict**: Check if port 3000 is already in use
3. **Permission issues**: Fix with `sudo chown -R $USER:$USER /opt/Robotics-Program-Attendance`
4. **Environment variables**: Verify .env file still has correct settings

**Solution**:
```bash
cd /opt/Robotics-Program-Attendance/backend
sudo npm install
sudo systemctl restart robotics-backend.service
```

### Issue: New routes return 404

**Solution**: Verify code was pulled correctly
```bash
cd /opt/Robotics-Program-Attendance
git status
git log -1

# Check if new routes exist
ls backend/routes/coreHours.js
ls backend/routes/absences.js
ls backend/routes/reports.js
```

If files missing, re-pull:
```bash
sudo git pull origin main
sudo systemctl restart robotics-backend.service
```

### Issue: Database migration fails

**Check error message**:
```bash
cd /opt/Robotics-Program-Attendance/backend
sudo -u postgres node scripts/createAbsenceTables.js
```

**Common issues**:
1. **Tables already exist**: This is OK, skip migration
2. **Permission denied**: Use `sudo -u postgres`
3. **Database connection failed**: Check backend/.env file

**Verify connection**:
```bash
sudo -u postgres psql -d robotics_attendance -c "SELECT 1;"
```

### Issue: Nginx shows 502 Bad Gateway

**Cause**: Backend service not running

**Solution**:
```bash
# Check backend status
sudo systemctl status robotics-backend.service

# If not running, start it
sudo systemctl start robotics-backend.service

# Check logs for errors
sudo journalctl -u robotics-backend.service -n 50
```

### Issue: Frontend shows old version (no new menu items)

**Solution**: Clear Nginx cache and rebuild frontend
```bash
# If using npm run build (production)
cd /opt/Robotics-Program-Attendance/frontend
sudo npm run build
sudo systemctl restart robotics-frontend.service

# Clear browser cache
# In browser: Ctrl+Shift+R (hard refresh)
```

### Issue: Permission denied errors

**Solution**: Fix ownership
```bash
sudo chown -R ubuntu:ubuntu /opt/Robotics-Program-Attendance

# Or for your specific user
sudo chown -R $USER:$USER /opt/Robotics-Program-Attendance
```

---

## Rollback Procedure (If Update Fails)

If critical issues occur:

### Step 1: Stop Services

```bash
sudo systemctl stop robotics-backend.service
sudo systemctl stop robotics-frontend.service
```

### Step 2: Restore Database

```bash
# Find your pre-update backup
ls -lh /opt/backups/

# Restore database
gunzip < /opt/backups/robotics_attendance_pre_update_YYYYMMDD_HHMMSS.sql.gz | \
  sudo -u postgres psql robotics_attendance

# Verify restoration
sudo -u postgres psql -d robotics_attendance -c "SELECT COUNT(*) FROM users;"
```

### Step 3: Revert Code

```bash
cd /opt/Robotics-Program-Attendance

# Find commit before update
git log --oneline -10

# Reset to previous commit
sudo git reset --hard <commit-hash>

# Or restore from stash
sudo git stash pop
```

### Step 4: Restart Services

```bash
sudo systemctl start robotics-backend.service
sudo systemctl start robotics-frontend.service

# Verify they're running
sudo systemctl status robotics-backend.service
sudo systemctl status robotics-frontend.service
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
└── createAbsenceTables.js (NEW)
```

### Modified Backend Files
```
backend/server.js          (UPDATED - routes added)
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
frontend/src/App.jsx              (UPDATED - routes)
frontend/src/pages/PresenceBoard.jsx  (UPDATED)
frontend/src/pages/PresenceBoard.css  (UPDATED)
```

### New Database Tables
```
core_hours     (Required attendance times)
absences       (Absence tracking with approval)
absence_logs   (Complete audit trail)
```

### New API Endpoints
```
/api/core-hours       (5 endpoints)
/api/absences         (7 endpoints)
/api/reports          (4 endpoints)
```

---

## Post-Update Configuration

### Configure Core Hours

```bash
# Via web interface:
1. Login as mentor/coach
2. Navigate to "Core Hours Configuration"
3. Add your team's schedule
```

### Automated Backup of New Tables

Update your backup script to include new tables:

```bash
sudo nano /opt/backups/backup_postgresql.sh
```

Existing script should already backup entire database, but verify.

---

## Performance Monitoring

### Check Service Resource Usage

```bash
# CPU and memory usage
systemctl status robotics-backend.service

# Or more detailed
ps aux | grep node

# Disk space
df -h

# Database size
sudo -u postgres psql -d robotics_attendance -c "
  SELECT pg_size_pretty(pg_database_size('robotics_attendance'));"
```

### Monitor Logs

```bash
# Watch backend logs in real-time
sudo journalctl -u robotics-backend.service -f

# Watch Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Watch for errors
sudo tail -f /var/log/nginx/error.log
```

---

## Quick Reference Commands

```bash
# Check service status
sudo systemctl status robotics-backend.service

# Restart services
sudo systemctl restart robotics-backend.service
sudo systemctl restart robotics-frontend.service

# View logs
sudo journalctl -u robotics-backend.service -n 50 -f

# Check listening ports
sudo ss -tlnp | grep -E ':(3000|5173|80|443)'

# Test backend API
curl http://localhost:3000/api/core-hours

# Backup database
sudo -u postgres pg_dump robotics_attendance | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip < backup.sql.gz | sudo -u postgres psql robotics_attendance
```

---

## Security Notes

After update, verify:

```bash
# Check file permissions
ls -la /opt/Robotics-Program-Attendance/backend/.env

# Should NOT be world-readable
# If it is: chmod 600 backend/.env

# Check service user
sudo systemctl show robotics-backend.service | grep User

# Verify firewall rules
sudo ufw status
```

---

## Need Help?

**Check logs first**:
```bash
sudo journalctl -u robotics-backend.service -n 100
sudo journalctl -u robotics-frontend.service -n 100
sudo tail -100 /var/log/nginx/error.log
```

**Documentation**:
- Feature guide: `docs/guides/ABSENCE_MANAGEMENT_GUIDE.md`
- Testing guide: `docs/guides/QUICK_START_TESTING.md`
- Ubuntu troubleshooting: `docs/technical/UBUNTU_SERVER_INSTALLATION.md`

**Common solutions**:
- Restart services: `sudo systemctl restart robotics-backend.service`
- Check permissions: `sudo chown -R $USER:$USER /opt/Robotics-Program-Attendance`
- Reinstall dependencies: `cd backend && sudo npm install`

---

## Update Verification Complete ✅

If all checklist items pass:
- ✅ Services running without errors
- ✅ New features accessible
- ✅ Existing features still work
- ✅ Database migration successful
- ✅ No errors in logs

**Your Ubuntu server is successfully updated!**

---

**Update completed**: January 6, 2026
**Features added**: Absence Management, Core Hours Configuration, Reporting
**Database changes**: 3 new tables, 5 new indexes, 27 new API endpoints
**Downtime**: ~5 minutes (during service restart)
