# Ubuntu Server Installation Guide

Complete guide for installing the Robotics Attendance System on Ubuntu Server.

---

## Prerequisites

- Ubuntu Server 20.04 LTS or newer
- Root/sudo access
- Basic familiarity with command line
- A domain name (optional, for HTTPS)

---

## 1. System Preparation

### Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Create Deployment User (if needed)

If the `atmgr` user doesn't exist:

```bash
sudo adduser atmgr
sudo usermod -aG sudo atmgr
```

Switch to the deployment user:

```bash
su - atmgr
```

---

## 2. Install System Dependencies

### Install Node.js 18 LTS

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and build tools
sudo apt install -y nodejs build-essential

# Verify installation
node -v
npm -v
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

### Install Nginx

```bash
sudo apt install -y nginx

# Enable and start nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

### Install Git (if not present)

```bash
sudo apt install -y git
```

---

## 3. Database Setup

### Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt, run:
CREATE USER attendance_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE attendance OWNER attendance_user;
\q
```

### Test Database Connection

```bash
psql -U attendance_user -d attendance -h localhost -W
# Enter password when prompted, then \q to quit
```

### Reset Password (if needed)

```bash
sudo -u postgres psql
\password attendance_user
# Enter new password twice
\q
```

---

## 4. Clone Repository

### Create Project Directory

```bash
sudo mkdir -p /var/www
cd /var/www
```

### Clone the Repository

```bash
# Clone your repository (replace with your actual repo URL)
sudo git clone https://github.com/yourusername/RoboticsAttendance.git
```

### Set Ownership

```bash
sudo chown -R atmgr:atmgr /var/www/RoboticsAttendance
cd /var/www/RoboticsAttendance
```

---

## 5. Backend Configuration

### Install Backend Dependencies

```bash
cd /var/www/RoboticsAttendance/backend
npm ci --only=production
```

### Create Environment File

Create `backend/.env`:

```bash
nano .env
```

Add the following content (adjust values as needed):

```
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance
DB_USER=attendance_user
DB_PASSWORD=your_secure_password_here

# JWT Authentication
JWT_SECRET=generate-a-very-long-random-secret-here-at-least-32-characters
JWT_EXPIRES_IN=12h
```

**Important:** Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Secure the Environment File

```bash
chmod 640 .env
chown atmgr:atmgr .env
```

### Initialize Database

```bash
# Initialize schema
node scripts/initDatabase.js

# Seed sample data (optional)
node scripts/seedDatabase.js
```

**Sample Login Credentials** (from seeding):
- Student: `jdoe` / PIN: `1234`
- Student: `jsmith` / PIN: `5678`
- Mentor: `bjohnson` / PIN: `9999`
- Coach: `awilliams` / PIN: `0000`

---

## 6. Backend Service Setup (systemd)

### Create systemd Service File

```bash
sudo nano /etc/systemd/system/rob-attendance-backend.service
```

Add the following content:

```ini
[Unit]
Description=Robotics Attendance Backend
After=network.target

[Service]
Type=simple
User=atmgr
WorkingDirectory=/var/www/RoboticsAttendance/backend
EnvironmentFile=/var/www/RoboticsAttendance/backend/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rob-attendance-backend

[Install]
WantedBy=multi-user.target
```

**Note:** Verify node path with `which node` and update `ExecStart` if needed.

### Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rob-attendance-backend
sudo systemctl status rob-attendance-backend
```

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u rob-attendance-backend -f

# View recent logs
sudo journalctl -u rob-attendance-backend -n 50
```

### Test Backend Health

```bash
curl -sS http://127.0.0.1:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 7. Frontend Build and Configuration

### Install Frontend Dependencies

```bash
cd /var/www/RoboticsAttendance/frontend
npm install
```

**Note:** If you get "Permission denied" errors with vite:
```bash
# Fix permissions
chmod +x node_modules/.bin/vite
sudo chown -R atmgr:atmgr /var/www/RoboticsAttendance

# Or reinstall
rm -rf node_modules package-lock.json
npm ci
```

### Build Frontend

```bash
npm run build
```

This creates a `dist/` folder with the production build.

### Copy Build to Web Directory

```bash
sudo mkdir -p /var/www/rob-attendance-site
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site
```

---

## 8. Nginx Configuration

### Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/rob-attendance
```

Add the following (replace `your.domain.tld` with your actual domain or server IP):

```nginx
server {
    listen 80;
    server_name your.domain.tld;

    root /var/www/rob-attendance-site;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Enable Site and Reload Nginx

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/rob-attendance /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 9. Firewall Configuration

### Configure UFW

```bash
# Allow SSH (important - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Important:** Backend port 3000 should NOT be open to the internet - nginx proxies to it on localhost.

---

## 10. HTTPS Setup (Optional but Recommended)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d your.domain.tld
```

Follow the prompts. Certbot will:
- Obtain and install the certificate
- Update nginx configuration
- Set up automatic renewal

### Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## 11. Verification

### Check All Services

```bash
# Backend service
sudo systemctl status rob-attendance-backend

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Test Application

1. **Backend Health:**
   ```bash
   curl http://127.0.0.1:3000/health
   ```

2. **Frontend (via Nginx):**
   ```bash
   curl -I http://your.domain.tld
   ```

3. **Browser Test:**
   - Open `http://your.domain.tld` (or `https://` if SSL configured)
   - You should see the attendance system login page

4. **Test Login:**
   - Use sample credentials from seeding (e.g., `jdoe` / `1234`)

---

## 12. Common Troubleshooting

### Backend Won't Start - User Credential Error

**Error:** `Failed to determine user credentials: No such process`

**Solution:**
```bash
# Verify user exists
id atmgr

# If not, create user
sudo useradd --system --home /var/www/RoboticsAttendance --shell /usr/sbin/nologin atmgr

# Fix ownership
sudo chown -R atmgr:atmgr /var/www/RoboticsAttendance

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart rob-attendance-backend
```

### Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
sudo ss -ltnp | grep :3000

# Stop the backend service if running
sudo systemctl stop rob-attendance-backend

# Or kill specific process by PID
sudo kill -9 <PID>

# Restart service
sudo systemctl start rob-attendance-backend
```

### Database Connection Fails

**Solutions:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Reset password
sudo -u postgres psql
\password attendance_user
\q

# Update .env with correct password
nano /var/www/RoboticsAttendance/backend/.env

# Restart backend
sudo systemctl restart rob-attendance-backend
```

### Nginx 502 Bad Gateway

**Solutions:**
```bash
# Check backend is running
curl http://127.0.0.1:3000/health

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass port matches backend PORT in .env
sudo nano /etc/nginx/sites-available/rob-attendance

# Reload nginx
sudo systemctl reload nginx
```

### Frontend Permission Denied (vite)

**Error:** `sh: 1: vite: Permission denied`

**Solutions:**
```bash
cd /var/www/RoboticsAttendance/frontend

# Fix permissions
chmod +x node_modules/.bin/vite
sudo chown -R atmgr:atmgr /var/www/RoboticsAttendance

# Or reinstall
rm -rf node_modules package-lock.json
npm ci

# Try building again
npm run build
```

---

## 13. Maintenance

### Updating the Application

```bash
# Pull latest code
cd /var/www/RoboticsAttendance
git pull

# Backend updates
cd backend
npm ci --only=production
sudo systemctl restart rob-attendance-backend

# Frontend updates
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/rob-attendance-site/
sudo chown -R www-data:www-data /var/www/rob-attendance-site
```

### View Logs

```bash
# Backend logs
sudo journalctl -u rob-attendance-backend -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump attendance > attendance_backup_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql attendance < attendance_backup_20260105.sql
```

### Service Management

```bash
# Restart backend
sudo systemctl restart rob-attendance-backend

# Stop backend
sudo systemctl stop rob-attendance-backend

# View status
sudo systemctl status rob-attendance-backend

# Disable auto-start
sudo systemctl disable rob-attendance-backend

# Re-enable auto-start
sudo systemctl enable rob-attendance-backend
```

---

## 14. Security Best Practices

1. **Keep secrets secure:**
   - Never commit `.env` files to git
   - Use strong passwords for database
   - Generate long random JWT_SECRET

2. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Regular backups:**
   - Database backups (daily)
   - Application code (use git)
   - Environment files (secure location)

4. **Monitor logs:**
   - Check for errors regularly
   - Set up log rotation
   - Consider centralized logging

5. **Firewall:**
   - Only expose necessary ports (80, 443, 22)
   - Keep backend port (3000) internal only
   - Consider fail2ban for SSH protection

---

## 15. Alternative: PM2 Process Manager

If you prefer PM2 instead of systemd:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
cd /var/www/RoboticsAttendance/backend
pm2 start server.js --name rob-attendance-backend --env production

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (sudo ...)

# View logs
pm2 logs rob-attendance-backend

# Monitor
pm2 monit

# Restart
pm2 restart rob-attendance-backend
```

---

## Support

For issues or questions:
- Check logs: `sudo journalctl -u rob-attendance-backend -f`
- Review this guide's troubleshooting section
- Check the main README.md for API documentation

---

**Installation Complete!** 🎉

Your Robotics Attendance System should now be running at `http://your.domain.tld` (or `https://` if SSL configured).
