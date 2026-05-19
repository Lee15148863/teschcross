require('dotenv').config();
const dns = require('dns');
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1']); // Bypass local DNS that blocks MongoDB Atlas
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.DOMAIN || 'techcross.ie';

// ─── Security: Helmet (default security headers) ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow onclick handlers in HTML
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", `https://${DOMAIN}`, `https://www.${DOMAIN}`, "http://localhost:*", "https://teschcross-git-1045728849939.europe-west1.run.app", "https://storeflow-test-mainpos-1045728849939.europe-west1.run.app", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://www.facebook.com", "https://facebook.com", "https://images.unsplash.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://www.facebook.com", "https://facebook.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// ─── CORS: allow production domain + local dev ──────────────────────────────
app.use(cors({
  origin: [
    `https://${DOMAIN}`,
    `https://www.${DOMAIN}`,
    'https://teschcross-git-1045728849939.europe-west1.run.app',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Block access to sensitive application files when serving static assets.
app.use((req, res, next) => {
  const blockedFiles = [
    '.env', '.env.local', 'package.json', 'package-lock.json',
    'Dockerfile', 'docker-compose.yml', 'README.md', 'README', '.gitignore',
    'gitignore', '.gitmodules', 'config.json', 'trigger-config.yaml'
  ];
  const reqPath = path.normalize(req.path).replace(/\\/g, '/');
  const baseName = path.basename(reqPath);
  if (blockedFiles.includes(baseName) || reqPath.includes('/.git')) {
    return res.status(404).end();
  }
  next();
});

// ─── Health endpoint (lightweight, no DB queries, always available) ─────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState,
    version: process.env.APP_VERSION || '',
    revision: process.env.K_REVISION || '',
    readonlyFrozen: process.env.STORE_FROZEN === 'true',
    uptime: process.uptime()
  });
});

// ─── App version endpoint (lightweight, for frontend freshness check) ────────
app.get('/api/app-version', (req, res) => {
  res.json({
    version: process.env.APP_VERSION || 'dev',
    revision: process.env.K_REVISION || '',
    moduleSchemaVersion: process.env.STOREFLOW_MODULE_SCHEMA_VERSION || '1',
    buildTime: process.env.BUILD_TIME || ''
  });
});

// ─── No-store cache headers for HTML pages ──────────────────────────────────
app.use(function(req, res, next) {
  if (req.path.match(/\.html$/) || req.path.match(/^\/saas\/[a-z-]*$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ─── SaaS SPA: route /saas/* → saas/*.html (BEFORE static to avoid fallthrough)
const SAAS_PAGES = ['', 'login', 'register', 'dashboard', 'admin', 'admin-deployments', 'admin-releases', 'pos'];
app.use((req, res, next) => {
  const m = req.path.match(/^\/saas\/([a-z-]*)$/);
  if (m && SAAS_PAGES.includes(m[1])) {
    return res.sendFile(path.join(__dirname, 'saas', (m[1] || 'index') + '.html'));
  }
  next();
});

// ─── HTML template variable injection ────────────────────────────────────
// MUST be before express.static — intercepts .html file requests,
// reads file from disk, replaces template tokens, sends result.
// express.static serves all other static files (JS, CSS, images, etc.).
function beautifyStoreName(name) {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function getStoreDisplayName() {
  return process.env.STOREFLOW_STORE_ID
    ? beautifyStoreName(process.env.STORE_NAME || '') || 'Store POS'
    : process.env.COMPANY_NAME || 'TechCross Repair Centre';
}

const fs = require('fs');

app.use(function(req, res, next) {
  if (req.path.endsWith('.html')) {
    var filePath = path.join(__dirname, req.path);
    fs.readFile(filePath, 'utf8', function(err, content) {
      if (err) return next();
      const isTenant = !!process.env.STOREFLOW_STORE_ID;
      const displayName = getStoreDisplayName();
      content = content
        .replace(/__DOMAIN__/g, DOMAIN)
        .replace(/__GA_ID__/g, process.env.GOOGLE_ANALYTICS_ID || '')
        .replace(/__PRINT_AGENT_URL__/g, process.env.PRINT_AGENT_URL || 'http://localhost:9100')
        .replace(/__YEAR__/g, String(new Date().getFullYear()))
        .replace(/__COMPANY_NAME__/g, process.env.COMPANY_NAME || 'TechCross Repair Centre')
        .replace(/__COMPANY_LOCATION__/g, process.env.COMPANY_ADDRESS || 'Navan, Co. Meath, Ireland')
        .replace(/__COMPANY_EMAIL__/g, process.env.COMPANY_EMAIL || 'info@example.com')
        .replace(/__VAT_NUMBER__/g, process.env.VAT_NUMBER || 'IE3330982OH')
        .replace(/__FB_PAGE__/g, process.env.FACEBOOK_PAGE || 'techcrossnavan')
        .replace(/__IS_STOREFLOW_TENANT__/g, isTenant ? 'true' : 'false')
        .replace(/__STORE_DISPLAY_NAME__/g, displayName);
      res.send(content);
    });
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname), {
  dotfiles: 'deny',
  index: false
}));

// ─── Register all routes synchronously (before DB) ────────────
// Routes that hit MongoDB will fail gracefully if DB is not ready.

app.use('/api/pricing', require('./api/pricing'));
app.use('/api/brands', require('./api/brands'));
app.use('/api/reviews', require('./api/reviews'));
app.use('/api/banner', require('./api/banner'));

// Inventory & Till system routes

	// Tenant status gate — blocks all /api/inv access for suspended/frozen StoreFlow tenants
	// Only applies when STOREFLOW_STORE_ID env var is set (tenant services, not Main POS)
	app.use('/api/inv', function(req, res, next) {
	  if (process.env.STOREFLOW_STORE_ID) {
	    var tenantStatus = process.env.STOREFLOW_TENANT_STATUS || 'active';
	    if (req.path === '/health' || req.path === '/') return next();
	    if (tenantStatus === 'suspended' || tenantStatus === 'frozen') {
	      return res.status(403).json({
	        error: 'STORE_' + tenantStatus.toUpperCase(),
	        message: tenantStatus === 'frozen'
	          ? 'This store is currently frozen. All access is suspended. Please contact support.'
	          : 'This store is currently suspended. Please contact support.'
	      });
	    }
	  }
	  next();
	});
// Read-only freeze gate — blocks writes when STORE_FROZEN env var is 'true'
app.use('/api/inv', function(req, res, next) {
  if (process.env.STORE_FROZEN === 'true' && ['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(req.method) !== -1) {
    return res.status(403).json({ error: 'STORE_FROZEN_READONLY', message: 'System is in read-only mode.' });
  }
  next();
});
app.use('/api/inv/auth', require('./api/inv/auth'));
app.use('/api/inv/products', require('./api/inv/products'));
app.use('/api/inv/stock', require('./api/inv/stock'));
app.use('/api/inv/suppliers', require('./api/inv/suppliers'));
app.use('/api/inv/purchases', require('./api/inv/purchases'));
app.use('/api/inv/transactions', require('./api/inv/transactions'));
app.use('/api/inv/reports', require('./api/inv/reports'));
app.use('/api/inv/settings', require('./api/inv/settings'));
app.use('/api/inv/invoices', require('./api/inv/invoices'));
app.use('/api/inv/expenses', require('./api/inv/expenses'));
app.use('/api/inv/close', require('./api/inv/close'));
app.use('/api/inv/pos-shortcuts', require('./api/inv/pos-shortcuts'));
app.use('/api/inv/root', require('./api/inv/root'));
app.use('/api/inv/export', require('./api/inv/export'));
app.use('/api/inv/root/export', require('./api/inv/root-export'));
app.use('/api/inv/buyin-receipt', require('./api/inv/buyin-receipt'));
app.use('/api/inv/delivery', require('./api/inv/delivery'));
app.use('/api/inv/whatsapp', require('./api/inv/whatsapp'));
app.use('/api/inv/modules', require('./api/inv/modules'));

// ─── SaaS routes (separate from TechCross POS) ───────────────────────────
app.use('/api/saas/auth', require('./api/saas/auth'));
app.use('/api/saas/signup', require('./api/saas/signup'));
app.use('/api/saas/stores', require('./api/saas/stores'));
app.use('/api/saas/deployments', require('./api/saas/deployments'));
app.use('/api/saas/releases', require('./api/saas/releases'));
app.use('/api/saas/pos', require('./api/saas/pos'));

// ─── Public share routes (MUST be before the catch-all) ────────────────
app.use('/share', require('./api/inv/share-public'));
app.use('/api/share', require('./api/inv/share-public'));

// ─── Global error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
});

// Fallback: serve index.html for all remaining non-API routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start HTTP server first (Cloud Run needs port open ASAP) ──────
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});

// ─── Connect to MongoDB asynchronously ────────────────────────────
console.log('⏳ Connecting to MongoDB...');
mongoose.connect(process.env.DBCon || process.env.MONGO_URI, {
    dbName: process.env.STORE_NAME || 'techcross',
    serverSelectionTimeoutMS: 15000,  // timeout after 15s
    connectTimeoutMS: 15000
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));
