/**
 * ============================================================
 * ABNAN CRM — Backend Performance & Traffic Control (FIXED)
 * Rate limiting dinonaktifkan atau diperlonggar untuk development
 * ============================================================
 */

const rateLimit = require('express-rate-limit');
const slowDown  = require('express-slow-down');
const helmet    = require('helmet');
const compression = require('compression');
const mysql     = require('mysql2/promise');

// ── 1. MySQL Connection Pool ──────────────────────────────────
let pool = null;

function createPool(config = {}) {
  pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'abnan_crm',
    port:               parseInt(process.env.DB_PORT || '3306'),
    connectionLimit:    parseInt(process.env.DB_POOL_SIZE  || '20'),
    queueLimit:         parseInt(process.env.DB_QUEUE_LIMIT || '50'),
    waitForConnections: true,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 10000,
    connectTimeout:     10000,
    idleTimeout:        60000,
    multipleStatements: false,
    charset:            'utf8mb4',
    timezone:           '+07:00',
    ...config,
  });

  pool.on('connection', (conn) => console.log(`[DB] New connection ${conn.threadId}`));
  pool.on('acquire', (conn) => { if (process.env.NODE_ENV === 'development') console.log(`[DB] Connection ${conn.threadId} acquired`); });
  pool.on('release', (conn) => { if (process.env.NODE_ENV === 'development') console.log(`[DB] Connection ${conn.threadId} released`); });
  pool.on('enqueue', () => console.warn('[DB] Waiting for available connection slot'));

  return pool;
}

function getPool() {
  if (!pool) throw new Error('DB pool not initialized. Call createPool() first.');
  return pool;
}

async function query(sql, params = []) {
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

async function transaction(fn) {
  const conn = await getPool().getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── 2. In-Memory Cache ────────────────────────────────────────
class SimpleCache {
  constructor(maxSize = 200, defaultTTL = 60000) {
    this.store   = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  set(key, value, ttl = this.defaultTTL) {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  del(key) { this.store.delete(key); }
  flush() { this.store.clear(); }
  size() { return this.store.size; }
  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

const cache = new SimpleCache(500, 30000);

function cacheMiddleware(keyFn, ttl = 30000) {
  return (req, res, next) => {
    const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
    const cached = cache.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) cache.set(key, body, ttl);
      return originalJson(body);
    };
    next();
  };
}

// ── 3. Rate Limiters (diperlonggar untuk development) ─────────
const isProd = process.env.NODE_ENV === 'production';
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: disableRateLimit ? 0 : (isProd ? 200 : 1000000), // 0 = tidak ada batas (jika didukung)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request, coba lagi dalam beberapa menit.', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => req.path === '/health' || req.path === '/ping',
});

// Strict limit untuk auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: disableRateLimit ? 0 : (isProd ? 10 : 1000000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.', code: 'AUTH_RATE_LIMIT' },
});

// Slow down (diperlonggar)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: disableRateLimit ? Number.MAX_SAFE_INTEGER : (isProd ? 100 : 1000000),
  delayMs: (used) => (used - 100) * 200,
  maxDelayMs: 3000,
});

// ── 4. Security Headers ───────────────────────────────────────
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

// ── 5. Compression ────────────────────────────────────────────
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

// ── 6. Request Timeout ────────────────────────────────────────
function timeoutMiddleware(ms = 30000) {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: 'Request timeout. Server sedang sibuk, coba lagi.', code: 'REQUEST_TIMEOUT' });
      }
    }, ms);
    res.on('finish', () => clearTimeout(timeout));
    res.on('close',  () => clearTimeout(timeout));
    next();
  };
}

// ── 7. Request ID Middleware ──────────────────────────────────
let reqCounter = 0;
function requestIdMiddleware(req, res, next) {
  req.requestId = `REQ-${Date.now()}-${++reqCounter}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

// ── 8. Pagination Helper ──────────────────────────────────────
function parsePagination(query, maxLimit = 100) {
  const page  = Math.max(1, parseInt(query.page  || '1'));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || '20')));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

// ── 9. Standard Response Helpers ─────────────────────────────
const respond = {
  ok:      (res, data, message = 'Success')        => res.json({ success: true, message, data }),
  created: (res, data, message = 'Created')        => res.status(201).json({ success: true, message, data }),
  badReq:  (res, message = 'Bad Request')          => res.status(400).json({ success: false, message }),
  unauth:  (res, message = 'Unauthorized')         => res.status(401).json({ success: false, message }),
  forbidden:(res, message = 'Forbidden')           => res.status(403).json({ success: false, message }),
  notFound:(res, message = 'Not Found')            => res.status(404).json({ success: false, message }),
  conflict:(res, message = 'Conflict')             => res.status(409).json({ success: false, message }),
  error:   (res, err, message = 'Server Error')    => {
    console.error('[API Error]', err?.message || err);
    res.status(500).json({ success: false, message, ...(process.env.NODE_ENV === 'development' ? { debug: err?.message } : {}) });
  },
};

// ── 10. Apply Middleware (rate limiter optional) ──────────────
function applyPerformanceMiddleware(app) {
  app.use(requestIdMiddleware);
  app.use(securityMiddleware);
  app.use(compressionMiddleware);
  app.use(timeoutMiddleware(30000));
  // Pasang rate limiter hanya jika tidak di-disable
  if (!disableRateLimit) {
    app.use('/api', generalLimiter);
    app.use('/api', speedLimiter);
    app.use('/api/auth', authLimiter);
  } else {
    console.log('⚠️ Rate limiting dinonaktifkan (DISABLE_RATE_LIMIT=true)');
  }
}

// ── 11. Health Check Route ────────────────────────────────────
function healthCheckRoute(router) {
  router.get('/health', async (req, res) => {
    try {
      await query('SELECT 1');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: { size: cache.size() },
        db: 'connected',
        env: process.env.NODE_ENV || 'development',
      });
    } catch (err) {
      res.status(503).json({ status: 'error', db: err.message });
    }
  });
}

module.exports = {
  createPool,
  getPool,
  query,
  transaction,
  cache,
  cacheMiddleware,
  generalLimiter,
  authLimiter,
  speedLimiter,
  securityMiddleware,
  compressionMiddleware,
  timeoutMiddleware,
  requestIdMiddleware,
  parsePagination,
  paginatedResponse,
  respond,
  applyPerformanceMiddleware,
  healthCheckRoute,
};