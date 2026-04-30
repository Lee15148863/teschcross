require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
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

// Fallback: serve index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
