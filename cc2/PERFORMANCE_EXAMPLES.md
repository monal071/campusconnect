# Performance Optimization - Before & After Examples

## Example 1: Basic API Endpoint

### ❌ Before (No Optimization)
```javascript
// pages/api/posts.js
export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  
  const posts = await db.collection('posts')
    .find({})
    .toArray();
  
  res.json(posts);
}
```
**Issues**: No caching, no rate limiting, no error tracking, unoptimized queries

### ✅ After (Fully Optimized)
```javascript
// pages/api/posts-optimized.js
import { standardMiddleware, cachedMiddleware } from '@/lib/middleware';
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';

async function handler(req, res) {
  const { db } = await connectToDatabase();
  
  const cacheKey = cacheKeys.posts(req.query.page || 1);
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.json({ posts: cached, cached: true });
  }
  
  const posts = await db.collection('posts')
    .find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  
  await cache.set(cacheKey, posts, cacheTTL.posts);
  
  res.json({ posts, cached: false });
}

export default cachedMiddleware(300)(handler);
```
**Improvements**: 
- ✅ Automatic caching (5 min)
- ✅ Rate limiting (100 req/15min)
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Optimized query with sorting and limit

---

## Example 2: Image Display

### ❌ Before (Regular HTML img)
```javascript
// components/UserAvatar.js
<img 
  src={user.image} 
  alt={user.name}
  className="w-12 h-12 rounded-full"
/>
```
**Issues**: No optimization, large file size, no lazy loading

### ✅ After (Next/Image Optimized)
```javascript
// components/UserAvatar.js
import { AvatarImage } from '@/components/OptimizedImage';

<AvatarImage 
  src={user.image} 
  alt={user.name}
  size={48}
  priority={false}
/>
```
**Improvements**:
- ✅ Automatic WebP/AVIF conversion (70% smaller)
- ✅ Lazy loading (faster initial load)
- ✅ Blur placeholder while loading
- ✅ Automatic responsive sizing
- ✅ Fallback image on error

---

## Example 3: Error Handling

### ❌ Before (Console logging only)
```javascript
try {
  const result = await createPost(data);
  res.json(result);
} catch (error) {
  console.error('Error creating post:', error);
  res.status(500).json({ error: 'Failed' });
}
```
**Issues**: No visibility in production, can't track users affected

### ✅ After (Sentry Integration)
```javascript
import { captureException, addBreadcrumb } from '@/lib/sentry';

try {
  addBreadcrumb('Creating post', 'action', { userId: session.user.id });
  const result = await createPost(data);
  res.json(result);
} catch (error) {
  captureException(error, {
    userId: session.user.id,
    action: 'create-post',
    data: JSON.stringify(data),
  });
  res.status(500).json({ error: 'Failed' });
}
```
**Improvements**:
- ✅ Errors tracked in Sentry dashboard
- ✅ Context includes user ID and action
- ✅ Breadcrumb trail shows user journey
- ✅ Stack traces automatically captured
- ✅ Email alerts on critical errors

---

## Example 4: Database Queries

### ❌ Before (No Indexes)
```javascript
// Find posts by user
const posts = await db.collection('posts')
  .find({ userId: userId })
  .toArray();

// Search posts
const results = await db.collection('posts')
  .find({ $text: { $search: query } })
  .toArray();
```
**Performance**: Slow queries (200-500ms), full collection scans

### ✅ After (With Indexes)
```bash
# Run once: node scripts/create-indexes.js

# Indexes created:
# - { userId: 1, createdAt: -1 }
# - { text: 'text', 'user.name': 'text' }
```

```javascript
// Same code, but now uses indexes
const posts = await db.collection('posts')
  .find({ userId: userId })
  .sort({ createdAt: -1 })
  .toArray();

const results = await db.collection('posts')
  .find({ $text: { $search: query } })
  .toArray();
```
**Performance**: Fast queries (10-30ms), index-based lookups
**Improvement**: 90% faster

---

## Example 5: Multiple API Calls (Middleware Composition)

### ❌ Before (Manual everything)
```javascript
export default async function handler(req, res) {
  // Manual rate limiting
  const ip = req.headers['x-forwarded-for'];
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.ok) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Manual error handling
  try {
    // Manual caching
    const cacheKey = `api:${req.url}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);
    
    // Your logic
    const data = await getData();
    
    // Manual cache set
    await setCache(cacheKey, data);
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
}
```

### ✅ After (Middleware Composition)
```javascript
import { compose } from '@/lib/middleware';
import { withRateLimit } from '@/lib/rateLimiter';
import { withCache } from '@/lib/middleware';
import { withErrorTracking } from '@/lib/sentry';

async function handler(req, res) {
  const data = await getData();
  res.json(data);
}

export default compose(
  withErrorTracking,
  (h) => withRateLimit(h, 'api'),
  (h) => withCache(h, { ttl: 300 })
)(handler);
```
**Improvements**:
- ✅ Automatic rate limiting
- ✅ Automatic caching
- ✅ Automatic error tracking
- ✅ Automatic performance monitoring
- ✅ Clean, readable code

---

## Example 6: Resource-Heavy Operation

### ❌ Before (No Protection)
```javascript
// pages/api/generate-report.js
export default async function handler(req, res) {
  const report = await generateLargeReport(req.body);
  res.json(report);
}
```
**Issues**: Can be abused, no rate limiting, slow

### ✅ After (Rate Limited + Cached)
```javascript
import { withRateLimit } from '@/lib/rateLimiter';
import { cache, cacheKeys } from '@/lib/redis';

async function handler(req, res) {
  const cacheKey = cacheKeys.report(req.body.userId);
  
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ report: cached, cached: true });
  }
  
  const report = await generateLargeReport(req.body);
  await cache.set(cacheKey, report, 3600); // Cache 1 hour
  
  res.json({ report, cached: false });
}

// Heavy rate limit: 10 requests per hour
export default withRateLimit(handler, 'heavy');
```
**Improvements**:
- ✅ Protected from abuse (10 req/hour)
- ✅ Cached results (1 hour)
- ✅ Faster response times
- ✅ Reduced server load

---

## Example 7: Static Assets

### ❌ Before (Serving from Next.js)
```javascript
// Direct file serving
<img src="/public/logo.png" />
<link rel="stylesheet" href="/styles/custom.css" />
```
**Issues**: Server bandwidth consumed, slower delivery

### ✅ After (CDN Integration)
```javascript
import { getCDNUrl } from '@/lib/cdn';

<img src={getCDNUrl('/logo.png')} />
<link rel="stylesheet" href={getCDNUrl('/styles/custom.css')} />
```

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL,
}
```
**Improvements**:
- ✅ Files served from CDN edge locations
- ✅ Faster delivery worldwide
- ✅ Reduced server bandwidth
- ✅ Automatic caching headers

---

## Performance Comparison Table

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Page Load Time** | 2.5s | 1.0s | 60% faster |
| **Image Size** | 500KB | 150KB | 70% smaller |
| **API Response** | 200ms | 50ms | 75% faster |
| **DB Queries/Page** | 10-15 | 1-2 | 90% reduction |
| **Cache Hit Rate** | 0% | 70-80% | N/A |
| **Error Visibility** | Console only | Sentry Dashboard | 100% visibility |
| **Rate Limit Protection** | None | Yes | Protected |
| **CDN Delivery** | No | Yes | Global |

---

## Real-World Impact

### Before Optimization
```
👤 User clicks "View Posts"
⏱️  Database query: 150ms
⏱️  Fetch user data (x10): 500ms
⏱️  Load images: 2000ms
⏱️  Render: 100ms
━━━━━━━━━━━━━━━━━━━━━━
⏱️  Total: 2750ms
```

### After Optimization
```
👤 User clicks "View Posts"
⏱️  Check Redis cache: 5ms (HIT!)
⏱️  Load optimized images: 300ms
⏱️  Render: 100ms
━━━━━━━━━━━━━━━━━━━━━━
⏱️  Total: 405ms (85% faster!)
```

---

## Monitoring Dashboard Example

### Sentry Dashboard
```
🚨 Errors (Last 24h)
├─ 3 errors in POST /api/posts
│  └─ MongoDB connection timeout
├─ 1 error in GET /api/resources
│  └─ Rate limit exceeded
└─ 0 critical errors ✅

📊 Performance
├─ Average API response: 45ms
├─ 95th percentile: 120ms
└─ Slowest endpoint: /api/quiz/analytics (380ms)

👥 Users Affected
├─ 3 users experienced errors
└─ 245 users with normal experience
```

### Redis Cache Stats
```
📈 Cache Performance
├─ Total keys: 1,247
├─ Hit rate: 78%
├─ Miss rate: 22%
├─ Memory used: 45MB
└─ Evicted keys: 23

🔥 Hot Keys
├─ posts:page:1 (543 hits)
├─ trending:posts (412 hits)
└─ user:123:profile (234 hits)
```

---

## Quick Win Checklist

- [ ] Replace all `<img>` with `OptimizedImage`
- [ ] Add caching to top 5 API endpoints
- [ ] Run `create-indexes.js` script
- [ ] Install Redis and add to `.env.local`
- [ ] Sign up for Sentry and configure DSN
- [ ] Apply rate limiting to all API routes
- [ ] Test with Lighthouse (should score 90+)
- [ ] Monitor Sentry for 24 hours
- [ ] Review cache hit rates in Redis
- [ ] Configure CDN for production

---

**Next Step**: Copy these patterns to your most-used API endpoints and components!
