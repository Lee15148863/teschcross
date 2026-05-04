require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Security: Helmet (default security headers) ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // disabled to avoid breaking inline scripts in HTML pages
  crossOriginEmbedderPolicy: false
}));

// ─── CORS: allow production domain + local dev ──────────────────────────────
app.use(cors({
  origin: [
    'https://techcross.ie',
    'https://www.techcross.ie',
    'https://teschcross-git-1045728849939.europe-west1.run.app',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
mongoose.connect(process.env.DBCon, { dbName: 'techcross' })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// Routes
app.use('/api/pricing', require('./api/pricing'));
app.use('/api/brands', require('./api/brands'));
app.use('/api/reviews', require('./api/reviews'));

// Inventory & Till system routes
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
app.use('/api/inv/pos-shortcuts', require('./api/inv/pos-shortcuts'));

// Fallback: serve index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
