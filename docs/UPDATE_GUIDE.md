# Software Update Guide - Ubuntu Server

Step-by-step guide for updating the Robotics Attendance System on Ubuntu Server.

---

## Prerequisites

- SSH access to the Ubuntu server
- Git repository configured with remote
- `atmgr` user access with sudo privileges

---

## Standard Update Process

### 1. Connect to Server

```bash
ssh atmgr@your-server-ip
```

### 2. Navigate to Project Directory

```bash
cd /var/www/RoboticsAttendance
```

### 3. Check Current Status

```bash
# View current branch and status
git status
git branch

# Check running services
sudo systemctl status rob-attendance-backend
```

### 4. Backup Current State (Recommended)

```bash
# Note current commit for rollback if needed
git log --oneline -1

# Optional: backup database
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump attendance | gzip | sudo tee "$HOME/attendance_backup_$DATE.sql.gz" > /dev/null
```

### 5. Pull Latest Changes

```bash
git pull origin main
# Or specify your branch: git pull origin <branch-name>
```

If there are local changes that conflict:
```bash
# Stash local changes
git stash

# Pull updates
git pull origin main

# Optionally reapply stashed changes
git stash pop
```

### 6. Update Backend

```bash
cd backend

# Install/update dependencies
npm ci --only=production

# If database schema changed, run migrations
node scripts/initDatabase.js

# Restart backend service
sudo systemctl restart rob-attendance-backend

# Check service status
sudo systemctl status rob-attendance-backend

# Verify health endpoint
curl http://127.0.0.1:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-05T..."}
```

### 7. Update Frontend

```bash
cd ../frontend

# Install/update dependencies
npm ci

# Build production bundle
npm run build

# Copy build to nginx directory
sudo cp -r dist/* /var/www/rob-attendance-site/

# Set correct ownership for nginx
sudo chown -R www-data:www-data /var/www/rob-attendance-site
```

### 8. Verify Update

```bash
# Check backend logs
sudo journalctl -u rob-attendance-backend -n 50

# Test frontend via nginx
curl -I http://localhost

# Visit site in browser
# http://your-domain-or-ip
```

### 9. Monitor for Issues

```bash
# Follow backend logs
sudo journalctl -u rob-attendance-backend -f

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

Press `Ctrl+C` to stop following logs.

---

## Update with Environment Changes

If `.env` file needs updates:

```bash
cd /var/www/RoboticsAttendance/backend

# Edit environment file
nano .env

# Make your changes, save (Ctrl+O, Enter, Ctrl+X)

# Restart backend to apply
sudo systemctl restart rob-attendance-backend
```

**Important:** Never commit `.env` to git. Keep credentials secure.

---

## Database Schema Updates

If the update includes database changes:

### Option 1: Migration Script Provided

```bash
cd /var/www/RoboticsAttendance/backend

# Run the migration script
node scripts/migrate.js
# Or whatever migration script is provided
```

### Option 2: Reinitialize Schema

**Warning:** This may delete data. Backup first!

```bash
cd /var/www/RoboticsAttendance/backend

# Backup first
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump attendance | gzip | sudo tee "$HOME/attendance_backup_before_schema_$DATE.sql.gz" > /dev/null

# Reinitialize
node scripts/initDatabase.js
```

### Option 3: Manual SQL Updates

```bash
# Connect to database
psql -U attendance_user -d attendance -h localhost -W

# Run SQL commands
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);

# Exit
\q
```

---

## Rollback Procedure

If the update causes issues:

### 1. Identify Previous Working Version

```bash
cd /var/www/RoboticsAttendance

# View recent commits
git log --oneline -10
```

### 2. Revert to Previous Commit

```bash
# Checkout specific commit (replace with actual hash)
git checkout abc123def

# Or reset to previous commit
git reset --hard HEAD~1
```

### 3. Rebuild and Deploy

```bash
# Backend
cd backend
npm ci --only=production
sudo systemctl restart rob-attendance-backend

# Frontend
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site
```

### 4. Restore Database (if needed)

```bash
# Stop backend
sudo systemctl stop rob-attendance-backend

# Restore database
sudo -u postgres psql attendance < ~/attendance_backup_YYYYMMDD_HHMMSS.sql

# Start backend
sudo systemctl start rob-attendance-backend
```

---

## Zero-Downtime Updates (PM2 Alternative)

If using PM2 instead of systemd:

```bash
cd /var/www/RoboticsAttendance

# Pull changes
git pull origin main

# Update backend
cd backend
npm ci --only=production

# Reload backend with zero downtime
pm2 reload rob-attendance-backend

# Update frontend
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site
```

---

## Troubleshooting

### Backend Won't Start After Update

```bash
# Check logs for errors
sudo journalctl -u rob-attendance-backend -n 100

# Common issues:
# 1. Missing dependencies
cd /var/www/RoboticsAttendance/backend
npm ci --only=production

# 2. Database connection
curl http://127.0.0.1:3000/health

# 3. Port conflict
sudo ss -ltnp | grep :3000
sudo systemctl restart rob-attendance-backend
```

### Frontend Shows Old Version

```bash
# Clear browser cache (Ctrl+Shift+R in most browsers)

# Or verify files updated on server
ls -lh /var/www/rob-attendance-site/

# Check file timestamps
stat /var/www/rob-attendance-site/index.html

# Rebuild if needed
cd /var/www/RoboticsAttendance/frontend
rm -rf dist
npm run build
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site

# Force nginx to reload
sudo systemctl reload nginx
```

### Database Migration Failed

```bash
# Restore from backup
sudo systemctl stop rob-attendance-backend
sudo -u postgres psql attendance < ~/attendance_backup_YYYYMMDD.sql
sudo systemctl start rob-attendance-backend

# Check migration script for errors
cd /var/www/RoboticsAttendance/backend
node scripts/initDatabase.js
```

### Permission Errors

```bash
# Fix project ownership
sudo chown -R atmgr:atmgr /var/www/RoboticsAttendance

# Fix frontend nginx ownership
sudo chown -R www-data:www-data /var/www/rob-attendance-site

# Fix .env permissions
chmod 640 /var/www/RoboticsAttendance/backend/.env
```

### Git Pull Conflicts

```bash
# If you have uncommitted changes
git stash
git pull origin main
git stash pop

# If you want to discard local changes
git reset --hard HEAD
git pull origin main

# If specific files conflict
git checkout --theirs path/to/file  # use remote version
# or
git checkout --ours path/to/file    # keep local version
```

---

## Update Checklist

Use this checklist for each update:

- [ ] SSH into server as `atmgr`
- [ ] Navigate to `/var/www/RoboticsAttendance`
- [ ] Check current commit: `git log --oneline -1`
- [ ] Backup database (if schema changes expected)
- [ ] Pull latest: `git pull origin main`
- [ ] Update backend dependencies: `cd backend && npm ci --only=production`
- [ ] Run migrations if needed: `node scripts/initDatabase.js`
- [ ] Restart backend: `sudo systemctl restart rob-attendance-backend`
- [ ] Check health: `curl http://127.0.0.1:3000/health`
- [ ] Update frontend: `cd ../frontend && npm ci && npm run build`
- [ ] Copy to nginx: `sudo cp -r dist/* /var/www/rob-attendance-site/`
- [ ] Fix permissions: `sudo chown -R www-data:www-data /var/www/rob-attendance-site`
- [ ] Test in browser
- [ ] Monitor logs: `sudo journalctl -u rob-attendance-backend -f`

---

## Automated Update Script (Optional)

Create a helper script for faster updates:

```bash
nano ~/update-attendance.sh
```

Add this content:

```bash
#!/bin/bash
set -e

echo "🔄 Starting Robotics Attendance System update..."

# Navigate to project
cd /var/www/RoboticsAttendance

# Record current version
CURRENT_COMMIT=$(git log --oneline -1)
echo "📌 Current version: $CURRENT_COMMIT"

# Pull latest
echo "📥 Pulling latest changes..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd backend
npm ci --only=production
sudo systemctl restart rob-attendance-backend
sleep 2

# Check health
echo "🏥 Checking backend health..."
if curl -f http://127.0.0.1:3000/health > /dev/null 2>&1; then
    echo "✅ Backend healthy"
else
    echo "❌ Backend health check failed!"
    exit 1
fi

# Update frontend
echo "🎨 Building frontend..."
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site

echo "✅ Update complete!"
echo "🔍 Monitor logs with: sudo journalctl -u rob-attendance-backend -f"
```

Make it executable:

```bash
chmod +x ~/update-attendance.sh
```

Run updates with:

```bash
~/update-attendance.sh
```

---

## Security Notes

1. **Always backup before major updates**
2. **Test updates in a staging environment first** (if available)
3. **Keep `.env` files secure** - never commit to git
4. **Monitor logs after updates** for 5-10 minutes
5. **Update system packages regularly:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Update Frequency Recommendations

- **Security patches:** As soon as available
- **Bug fixes:** Within 1-2 days
- **Feature updates:** Plan maintenance window
- **Dependencies:** Monthly review with `npm audit`

Check for dependency vulnerabilities:

```bash
cd /var/www/RoboticsAttendance/backend
npm audit

cd ../frontend
npm audit
```

---

## Getting Help

If issues persist after following this guide:

1. Check logs: `sudo journalctl -u rob-attendance-backend -f`
2. Review the main installation guide: `UBUNTU_INSTALL.md`
3. Check git history for breaking changes: `git log`
4. Restore from backup and report the issue

---

**Remember:** Always test updates in a non-production environment first when possible!
