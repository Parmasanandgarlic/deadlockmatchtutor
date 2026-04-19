# AfterMatch API - Setup Guide

## Overview
This guide walks you through setting up the complete AfterMatch API with Steam authentication, Redis caching, and extended database features.

## Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Redis server (optional but recommended for production)
- Steam Web API key

## Step 1: Get Steam API Key
1. Visit https://steamcommunity.com/dev/apikey
2. Log in with your Steam account
3. Enter your domain (e.g., `aftermatch.xyz` or `localhost` for development)
4. Copy your API key

## Step 2: Set Up Supabase Database

### Option A: Using Supabase Cloud (Recommended)
1. Create a new project at https://supabase.com
2. Go to SQL Editor and run the migration files:
   ```sql
   -- First, run the base schema
   -- Content from supabase-schema.sql
   
   -- Then run the extended schema
   -- Content from server/migrations/001-extended-schema.sql
   ```
3. Copy your project URL and API keys from Settings > API

### Option B: Self-hosted PostgreSQL
1. Install PostgreSQL 14+
2. Create a database: `CREATE DATABASE aftermatch;`
3. Run the migration SQL files using psql:
   ```bash
   psql -d aftermatch -f supabase-schema.sql
   psql -d aftermatch -f server/migrations/001-extended-schema.sql
   ```

## Step 3: Set Up Redis (Optional but Recommended)

### Using Docker
```bash
docker run -d -p 6379:6379 --name aftermatch-redis redis:latest
```

### Using Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Using Redis Cloud
1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy the connection URL

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   # Required
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   STEAM_API_KEY=your-steam-api-key-from-step-1
   SESSION_SECRET=generate-a-random-secret-key
   
   # Optional (Recommended for Production)
   REDIS_URL=redis://localhost:6379
   SENTRY_DSN=your-sentry-dsn
   ```

3. Generate a secure session secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## Step 5: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately
cd server && npm install
cd ../client && npm install
```

## Step 6: Run the Application

### Development Mode
```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5173).

### Production Mode
```bash
npm run build
npm start
```

## Step 7: Verify Setup

### Test Health Endpoint
```bash
curl http://localhost:3001/api/health
```

### Test Steam Authentication
1. Navigate to `http://localhost:5173/login` (or your deployed URL)
2. Click "Login with Steam"
3. Complete Steam authentication
4. You should be redirected back with an active session

### Check API Documentation
Visit `http://localhost:3001/api-docs` to view Swagger documentation

## New Features Enabled

### 1. Steam OpenID Authentication
- **POST** `/api/auth/steam` - Initiate login
- **GET** `/api/auth/steam/return` - Callback handler
- **GET** `/api/auth/me` - Get current user
- **POST** `/api/auth/logout` - Logout

### 2. User Favorites System
- **GET** `/api/auth/favorites` - List favorites
- **POST** `/api/auth/favorites` - Add favorite
- **DELETE** `/api/auth/favorites/:type/:targetId` - Remove favorite

### 3. User Settings
- **PUT** `/api/auth/settings` - Update user preferences

### 4. Redis Caching
- Automatic caching of Steam profiles
- Match data caching
- Session storage
- Rate limiting

### 5. Background Job Queue
- Asynchronous match analysis
- Profile updates
- Data cleanup tasks

### 6. Usage Analytics
- Event tracking
- User behavior insights
- API usage monitoring

## Database Tables Created

| Table | Purpose |
|-------|---------|
| `users` | Steam-linked user accounts |
| `player_profiles` | Cached player data |
| `favorites` | User bookmarks |
| `match_cache` | Cached match results |
| `sessions` | User sessions |
| `job_queue` | Background jobs |
| `usage_analytics` | Event tracking |
| `analyses` | Match analysis cache (existing) |

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Generate strong `SESSION_SECRET`
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure Sentry for error tracking
- [ ] Set up database backups
- [ ] Configure monitoring/alerting
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Load test the API

## Troubleshooting

### Steam Auth Not Working
- Verify STEAM_API_KEY is set correctly
- Check return URL matches your domain exactly
- Ensure cookies are enabled in browser

### Redis Connection Failed
- Check Redis server is running: `redis-cli ping`
- Verify REDIS_URL format: `redis://host:port`
- Check firewall rules allow port 6379

### Database Errors
- Verify Supabase URL and keys
- Check RLS policies are configured
- Run migrations in correct order

### Session Issues
- Ensure SESSION_SECRET is set
- Check cookie domain settings match your domain
- Verify Redis is storing sessions (if enabled)

## Next Steps

1. **Customize User Profiles**: Add avatar upload, custom bios
2. **Leaderboards**: Implement ranking systems
3. **Real-time Updates**: Add WebSocket support for live matches
4. **Discord Integration**: Enable Discord bot commands
5. **Premium Features**: Add subscription tiers
6. **API Keys**: Allow developers to get API access

## Support

For issues or questions:
- Check existing GitHub issues
- Review API documentation at `/api-docs`
- Contact: contact@aftermatch.xyz
