# HRMS Production Deployment Guide

## 1. Fresh Server Setup & Ubuntu 24 Installation
1. Provision a fresh Ubuntu 24.04 LTS instance with at least 2 vCPUs and 4GB RAM.
2. Update system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Secure the server by configuring UFW (Uncomplicated Firewall):
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

## 2. Docker Installation
1. Install Docker and Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
2. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

## 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/my_ai_project

# Auth
JWT_SECRET=your_super_secret_jwt_key

# Monitoring
SENTRY_DSN=your_sentry_backend_dsn
SENTRY_ENVIRONMENT=production

# Email
SMTP_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Port
PORT=3000
```

## 4. Docker Compose Startup
1. Clone the repository and navigate to the root directory.
2. Build and start the services in detached mode:
   ```bash
   docker compose up --build -d
   ```
3. Check the status of the containers:
   ```bash
   docker compose ps
   ```

## 5. SSL Setup
1. Point your domain (e.g., `hrms.yourdomain.com`) to the server's IP address.
2. Install Certbot and configure Nginx (if using a reverse proxy in front of the frontend container):
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d hrms.yourdomain.com
   ```

## 6. Backups
1. Create a cron job to backup the PostgreSQL database daily:
   ```bash
   0 2 * * * docker exec -t my-ai-project-postgres-1 pg_dumpall -c -U user > /path/to/backups/dump_$(date +\%Y-\%m-\%d).sql
   ```

## 7. Rollback Strategy
If a deployment fails or introduces critical bugs:
1. Revert the Git repository to the previous stable commit.
2. Rebuild and restart the containers:
   ```bash
   docker compose down
   git checkout <previous_commit_hash>
   docker compose up --build -d
   ```
3. If database migrations were applied, you may need to restore from the latest backup.
