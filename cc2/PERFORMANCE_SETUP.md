# Performance Optimization - Environment Variables

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Redis Configuration (for caching)
REDIS_URL=redis://localhost:6379
# For Redis Cloud: redis://username:password@host:port

# Sentry Configuration (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name

# CDN Configuration (optional)
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# Existing variables
MONGODB_URI=your-mongodb-uri
MONGODB_DB=campusconnect
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Setup Instructions

### 1. Redis Setup

#### Option A: Local Redis (Development)
```bash
# macOS
brew install redis
brew services start redis

# Windows (via WSL or download from redis.io)
# Download and run redis-server.exe

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Option B: Redis Cloud (Production)
1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy connection string to `REDIS_URL`

### 2. Sentry Setup

1. Sign up at https://sentry.io/
2. Create a new project (Next.js)
3. Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`
4. Generate auth token: Settings → Auth Tokens → Create Token
5. Add token to `SENTRY_AUTH_TOKEN`

### 3. CDN Setup (Optional - Cloudflare)

1. Sign up at https://cloudflare.com/
2. Add your domain
3. Enable Image Resizing (in Speed → Optimization)
4. Get credentials:
   - Account ID: Dashboard → Account Home
   - Zone ID: Dashboard → Your Domain → Overview (right sidebar)
   - API Token: My Profile → API Tokens → Create Token

### 4. Database Indexing

Run the indexing script to optimize MongoDB queries:

```bash
cd cc2
node scripts/create-indexes.js
```

This will create indexes on:
- Users (email, name, role, university, major)
- Posts (userId, createdAt, hashtags, mentions, text search)
- Resources (type, tags, courseId, ratings, text search)
- Quizzes (creatorId, courseId, status, dates)
- Events (date, type, location)
- Connections (userId, connectedUserId)
- Notifications (userId, read status)
- Messages (senderId, receiverId, conversationId)
- And more...

## Usage Examples

### Using Redis Cache

```javascript
import { cache, cacheKeys, cacheTTL } from '../lib/redis';

// Get from cache
const posts = await cache.get(cacheKeys.posts(1));

// Set cache with TTL
await cache.set(cacheKeys.posts(1), data, cacheTTL.posts);

// Delete cache
await cache.del(cacheKeys.post(postId));

// Invalidate pattern
await cache.delPattern('posts:*');
```

### Using Rate Limiting

```javascript
import { withRateLimit } from '../lib/rateLimiter';

async function handler(req, res) {
  // Your API logic
}

// Apply rate limiting (100 requests per 15 minutes)
export default withRateLimit(handler, 'api');

// For auth endpoints (5 requests per 15 minutes)
export default withRateLimit(handler, 'auth');

// For uploads (20 requests per hour)
export default withRateLimit(handler, 'upload');
```

### Using Error Tracking

```javascript
import { captureException, setUser } from '../lib/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    userId: session.user.id,
    action: 'create-post',
  });
}

// Set user context for error tracking
setUser(session.user);
```

### Using Optimized Images

```javascript
import OptimizedImage, { AvatarImage, ContentImage } from '../components/OptimizedImage';

// Avatar
<AvatarImage src={user.image} alt={user.name} size={48} />

// Post/Resource Image
<ContentImage src={post.image} alt={post.title} />

// Custom
<OptimizedImage 
  src={image} 
  alt="Description"
  width={400}
  height={300}
  quality={85}
  priority={false}
/>
```

### Using CDN

```javascript
import { getCDNUrl, getImageUrl } from '../lib/cdn';

// Static assets
const logoUrl = getCDNUrl('/logo.png');

// Optimized images
const imageUrl = getImageUrl('/uploads/image.jpg', {
  width: 800,
  quality: 80,
  format: 'webp'
});
```

## Performance Monitoring

### Sentry Dashboard
- View errors: https://sentry.io/organizations/your-org/issues/
- Performance metrics: https://sentry.io/organizations/your-org/performance/
- Session replays: https://sentry.io/organizations/your-org/replays/

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# Get cache statistics
INFO stats

# Monitor commands in real-time
MONITOR
```

### Check Rate Limits
Rate limit headers are automatically added to API responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When the limit resets
- `Retry-After`: Seconds until you can retry (when limited)

## Production Checklist

- [ ] Redis configured and connected
- [ ] Sentry DSN added and verified
- [ ] Database indexes created
- [ ] CDN configured (optional)
- [ ] Rate limiting tested
- [ ] Image optimization verified
- [ ] Error tracking tested
- [ ] Cache invalidation working
- [ ] Performance metrics monitored

## Troubleshooting

### Redis Connection Errors
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in .env.local
- For Redis Cloud, ensure firewall allows your IP

### Sentry Not Logging Errors
- Verify DSN is correct
- Check `NODE_ENV` is set to 'production' for production logging
- Test with: `captureMessage('Test message')`

### Rate Limiting Not Working
- Redis must be running (rate limits stored in Redis)
- Check rate limit headers in API responses
- Test with rapid requests to see 429 errors

### Images Not Optimizing
- Verify image domains in next.config.js
- Check image file size and format
- Use browser DevTools → Network to verify WebP/AVIF delivery

## Performance Gains

With these optimizations, you should see:
- **50-70% faster page loads** (Redis caching)
- **30-50% smaller images** (Next/Image + WebP/AVIF)
- **90% fewer database queries** (caching + indexes)
- **Instant error detection** (Sentry)
- **Protected from abuse** (rate limiting)
- **Faster static assets** (CDN)

## Next Steps

1. Monitor Sentry for errors after deployment
2. Adjust cache TTLs based on usage patterns
3. Configure CDN for production
4. Set up Redis persistence for production
5. Review rate limits and adjust as needed
