# CryptoAnalyzer Docker Deployment

This directory contains Docker configuration for deploying the full CryptoAnalyzer stack.

## Quick Start

```bash
# 1. Copy environment file
cp docker/.env.example docker/.env

# 2. Edit .env with your settings (especially SECRET_KEY!)
nano docker/.env

# 3. Build and start all services
docker-compose -f docker/docker-compose.yml up -d --build

# 4. Check status
docker-compose -f docker/docker-compose.yml ps

# 5. View logs
docker-compose -f docker/docker-compose.yml logs -f
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | React dashboard (nginx) |
| **Backend** | 8000 | FastAPI REST API + WebSocket |
| **Redis** | 6379 | Caching & pub/sub |

## Access Points

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health
- **WebSocket**: ws://localhost:8000/ws

## Data Persistence

The following directories are mounted as volumes:

```
../data/          → /app/data/          (Raw & processed data)
../models/        → /app/models/        (Model checkpoints)
../experiments/   → /app/experiments/   (Results & metrics)
../reports/       → /app/reports/       (Generated tables & figures)
```

## Running Data Pipeline

```bash
# Download data
docker-compose -f docker/docker-compose.yml --profile data run --rm data-downloader

# Or run individual scripts
docker-compose -f docker/docker-compose.yml exec backend python scripts/download_data.py
docker-compose -f docker/docker-compose.yml exec backend python scripts/compute_features.py
docker-compose -f docker/docker-compose.yml exec backend python scripts/build_sequences.py
docker-compose -f docker/docker-compose.yml exec backend python scripts/run_baselines.py
docker-compose -f docker/docker-compose.yml exec backend python scripts/run_dl_models.py
```

## Development

For local development without Docker:

```bash
# Backend
cd backend
pip install -r requirements.txt
pip install -e ../src
python main.py

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

## Production Deployment

1. Set `ENVIRONMENT=production` and `DEBUG=false` in `.env`
2. Generate a strong `SECRET_KEY`
3. Use proper SSL/TLS termination (nginx, traefik, or cloud load balancer)
4. Configure proper `CORS_ORIGINS` for your domain
5. Set up monitoring (Prometheus + Grafana recommended)

## Troubleshooting

**Backend won't start:**
- Check Redis is healthy: `docker-compose logs redis`
- Verify data paths exist: `ls -la ../data/`
- Check logs: `docker-compose logs backend`

**Frontend can't connect to API:**
- Verify `REACT_APP_API_URL` in frontend build
- Check nginx proxy config in `docker/nginx.conf`
- Ensure backend health check passes

**WebSocket connection fails:**
- Ensure proxy passes Upgrade headers (see nginx.conf)
- Check firewall allows WebSocket traffic

## Resource Requirements

Minimum recommended:
- **CPU**: 2 cores
- **RAM**: 4 GB (8 GB recommended for DL models)
- **Disk**: 10 GB free space

## Updating

```bash
# Pull latest images
docker-compose -f docker/docker-compose.yml pull

# Rebuild and restart
docker-compose -f docker/docker-compose.yml up -d --build
```

## Cleanup

```bash
# Stop and remove containers
docker-compose -f docker/docker-compose.yml down

# Remove volumes (⚠️ deletes data!)
docker-compose -f docker/docker-compose.yml down -v
```