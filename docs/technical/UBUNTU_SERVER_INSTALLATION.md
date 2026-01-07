# Ubuntu Server Installation Guide

## Complete Setup for Ubuntu Server Deployment

This guide provides step-by-step instructions for deploying the Absence Management System on Ubuntu Server.

---

## Prerequisites

### System Requirements
- Ubuntu Server 20.04 LTS or higher
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Internet connection

### Required Software (to be installed)
- Node.js 16+ (LTS recommended)
- npm (comes with Node.js)
- PostgreSQL 12+
- Git

---

## Part 1: System Preparation

### Step 1: Update System Packages

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 2: Install Git

```bash
sudo apt-get install -y git
```

### Step 3: Install Node.js and npm

Install Node.js from NodeSource repository (recommended for stable LTS):

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PostgreSQL

```bash
# Install PostgreSQL and client tools
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Step 5: Create PostgreSQL User and Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE USER robotics_user WITH PASSWORD 'your_secure_password';
ALTER ROLE robotics_user CREATEDB;
CREATE DATABASE robotics_attendance OWNER robotics_user;
GRANT ALL PRIVILEGES ON DATABASE robotics_attendance TO robotics_user;
\q
```

**Important**: Replace `your_secure_password` with a strong password and save it.

---

## Part 2: Application Setup

### Step 6: Clone Repository

```bash
# Choose installation directory (e.g., /opt or /home/ubuntu)
cd /opt
sudo git clone https://github.com/YOUR_REPO/Robotics-Program-Attendance.git
sudo chown -R $USER:$USER Robotics-Program-Attendance
cd Robotics-Program-Attendance
```

### Step 7: Configure Environment Variables

#### Backend Configuration

```bash
# Create .env file for backend
nano backend/.env
```

Add the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robotics_attendance
DB_USER=robotics_user
DB_PASSWORD=your_secure_password
DB_SSL=false

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration (use existing from current setup)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Timezone (CST)
TZ=America/Chicago
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

#### Frontend Configuration

```bash
# Create .env file for frontend
nano frontend/.env.production
```

Add the following content:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Robotics Attendance System
```

### Step 8: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to project root
cd ..
```

---

## Part 3: Database Setup

### Step 9: Initialize Database Tables

```bash
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

```bash
psql -U robotics_user -d robotics_attendance -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema='public';"
```

You should see:
```
     table_name
─────────────────────
 users
 attendance_sessions
 core_hours
 absences
 absence_logs
 (and other existing tables)
```

---

## Part 4: Service Configuration (Systemd)

### Step 11: Create Backend Service File

```bash
sudo nano /etc/systemd/system/robotics-backend.service
```

Add the following content:

```ini
[Unit]
Description=Robotics Attendance Backend Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/Robotics-Program-Attendance/backend
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="PATH=/usr/local/bin:/usr/bin"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 12: Create Frontend Service File (Optional - for serving production build)

```bash
sudo nano /etc/systemd/system/robotics-frontend.service
```

Add the following content:

```ini
[Unit]
Description=Robotics Attendance Frontend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/Robotics-Program-Attendance/frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Note**: For production, use Nginx as reverse proxy instead of npm preview.

### Step 13: Enable Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable robotics-backend.service
sudo systemctl enable robotics-frontend.service

# Start services
sudo systemctl start robotics-backend.service
sudo systemctl start robotics-frontend.service

# Check status
sudo systemctl status robotics-backend.service
sudo systemctl status robotics-frontend.service
```

---

## Part 5: Reverse Proxy Setup (Nginx)

### Step 14: Install Nginx

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 15: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/robotics-attendance
```

Add the following configuration:

```nginx
upstream backend {
    server localhost:3000;
}

upstream frontend {
    server localhost:5173;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Step 16: Enable Nginx Config and Test

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/robotics-attendance \
    /etc/nginx/sites-enabled/robotics-attendance

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Part 6: SSL/TLS Configuration (Optional but Recommended)

### Step 17: Install Certbot (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Step 18: Update Nginx for HTTPS

```bash
sudo nano /etc/nginx/sites-available/robotics-attendance
```

Replace the `listen 80;` line with:

```nginx
listen 80;
listen [::]:80;
server_name your-domain.com;
return 301 https://$server_name$request_uri;

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}
```

---

## Part 7: Verification and Testing

### Step 19: Verify Services Are Running

```bash
# Check if services are running
sudo systemctl status robotics-backend.service
sudo systemctl status robotics-frontend.service
sudo systemctl status nginx

# Check if ports are listening
sudo netstat -tlnp | grep -E ':(3000|5173|80|443)'

# Or using ss (newer systems)
sudo ss -tlnp | grep -E ':(3000|5173|80|443)'
```

### Step 20: Test API Endpoint

```bash
# Test backend API
curl http://localhost:3000/health

# Expected response (if health endpoint exists)
# {"status":"ok"}
```

### Step 21: Access Application

1. Open browser and navigate to: `http://your-domain.com` (or `http://server-ip`)
2. Login with mentor/coach credentials
3. Navigate to new absence management pages

### Step 22: Check Logs

```bash
# Backend logs
sudo journalctl -u robotics-backend.service -n 50 -f

# Frontend logs
sudo journalctl -u robotics-frontend.service -n 50 -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## Part 8: Database Backups and Maintenance

### Step 23: Create Backup Script

```bash
# Create backup directory
mkdir -p /opt/backups

# Create backup script
sudo nano /opt/backups/backup_postgresql.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/robotics_attendance_$DATE.sql.gz"

# Backup database
pg_dump -U robotics_user -d robotics_attendance | gzip > "$BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "robotics_attendance_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Step 24: Schedule Automatic Backups

```bash
# Make script executable
sudo chmod +x /opt/backups/backup_postgresql.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e

# Add this line:
0 2 * * * /opt/backups/backup_postgresql.sh >> /var/log/backup.log 2>&1
```

---

## Part 9: Monitoring and Troubleshooting

### Common Commands

```bash
# Restart services
sudo systemctl restart robotics-backend.service
sudo systemctl restart robotics-frontend.service

# Stop services
sudo systemctl stop robotics-backend.service
sudo systemctl stop robotics-frontend.service

# View real-time logs
sudo journalctl -u robotics-backend.service -f

# Check disk space
df -h

# Check memory usage
free -h

# Check PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Troubleshooting

**Issue: Backend service won't start**
```bash
# Check logs
sudo journalctl -u robotics-backend.service -n 50

# Verify npm dependencies
cd /opt/Robotics-Program-Attendance/backend
npm install

# Restart service
sudo systemctl restart robotics-backend.service
```

**Issue: Can't connect to PostgreSQL**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL connection
psql -U robotics_user -d robotics_attendance -c "SELECT 1;"

# Review .env file settings
cat backend/.env | grep DB_
```

**Issue: Port already in use**
```bash
# Find what's using the port
sudo lsof -i :3000  # for port 3000
sudo lsof -i :5173  # for port 5173

# Kill process if needed
sudo kill -9 <PID>
```

---

## Part 10: Post-Installation

### Step 25: Configure Core Hours

1. SSH into server or access web interface
2. Login as mentor/coach
3. Navigate to "Core Hours Configuration"
4. Add schedule for your team:
   - Monday: 5:30 PM - 8:00 PM
   - Friday: 3:30 PM - 8:30 PM
   - Saturday: 10:00 AM - 4:00 PM

### Step 26: Test System

Follow the testing guide in `QUICK_START_TESTING.md`:
1. Record test absence
2. Approve absence
3. Generate report
4. Check presence board

---

## Environment-Specific Notes

### Development vs Production

**Development** (Windows/Local):
- Use npm run dev for hot reload
- Direct database connections
- Detailed error logging

**Production** (Ubuntu Server):
- Use pm2 or systemd for process management
- Nginx reverse proxy
- Environment variables for sensitive data
- SSL/TLS encryption
- Automated backups
- Monitoring and logging

---

## Performance Tuning (Optional)

### PostgreSQL Optimization

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/12/main/postgresql.conf

# Recommended settings for 4GB RAM:
# shared_buffers = 1GB
# effective_cache_size = 3GB
# work_mem = 256MB
# maintenance_work_mem = 256MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Optimization

```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf

# Add in http block:
# worker_processes auto;
# worker_connections 1024;
# gzip on;
```

---

## Security Hardening

### Essential Security Steps

1. **Update system regularly**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Configure firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **Secure PostgreSQL**
   - Use strong passwords
   - Restrict connections to localhost
   - Regular backups

4. **Monitor logs**
   ```bash
   sudo tail -f /var/log/auth.log
   sudo tail -f /var/log/syslog
   ```

---

## Rollback Procedure

If something goes wrong:

```bash
# Stop services
sudo systemctl stop robotics-backend.service
sudo systemctl stop robotics-frontend.service

# Check last backup
ls -lt /opt/backups/

# Restore from backup
gunzip < /opt/backups/robotics_attendance_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U robotics_user -d robotics_attendance

# Verify restoration
psql -U robotics_user -d robotics_attendance -c "SELECT COUNT(*) FROM absences;"

# Restart services
sudo systemctl start robotics-backend.service
sudo systemctl start robotics-frontend.service
```

---

## Quick Reference

**Service Management**
```bash
sudo systemctl start robotics-backend.service    # Start backend
sudo systemctl stop robotics-backend.service     # Stop backend
sudo systemctl restart robotics-backend.service  # Restart backend
```

**Database Access**
```bash
psql -U robotics_user -d robotics_attendance    # Connect to DB
```

**Log Viewing**
```bash
sudo journalctl -u robotics-backend.service -f  # Real-time logs
```

**Application Location**
```bash
/opt/Robotics-Program-Attendance/
```

---

**Installation Status**: Complete!

Next: Follow the Testing Guide (QUICK_START_TESTING.md) to verify everything works.
