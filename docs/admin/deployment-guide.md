# Deployment Guide

This guide details the exact commands required to deploy the HRMS platform to a fresh Linux Ubuntu server using Docker.

## 1. Prerequisites
Ensure the server has Docker and Git installed.
```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-v2
```

## 2. Clone the Repository
```bash
git clone https://github.com/your-org/hrms-payroll-saas.git
cd hrms-payroll-saas
```

## 3. Configure the Environment
Create the `.env` file based on the example template.
```bash
cp .env.example .env
```
Edit the `.env` file using your preferred editor (e.g., `nano .env`) to set the `JWT_SECRET`, `DATABASE_URL`, and SMTP credentials.

## 4. Build and Start the Containers
Execute the Docker Compose build. The `-d` flag runs the containers in the background.
```bash
docker compose up --build -d
```

## 5. Verify Container Status
Check that all containers (Frontend, Backend API, Postgres, Redis) are running and healthy:
```bash
docker compose ps
```

## 6. Apply Database Schema
Since this is a fresh install, initialize the database schema and seed the initial SuperAdmin account:
```bash
docker exec -it api npx prisma migrate deploy
docker exec -it api npx prisma db seed
```

The platform is now accessible on port `4173` (Frontend) and `3000` (API). You should place an NGINX reverse proxy with an SSL certificate in front of these ports for production use.
