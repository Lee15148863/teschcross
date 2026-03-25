const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');

function adminAuth(req, res, next) {
    if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// GET /api/brands — return all brands as { brandId: { name, models } }
router.get('/', async (req, res) => {
    try {
        const docs = await Brand.find({});
        const result = {};
        docs.forEach(d => { result[d.brandId] = { name: d.name, types: d.types }; });
        res.json(result);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/brands/:brandId
router.get('/:brandId', async (req, res) => {
    try {
        const doc = await Brand.findOne({ brandId: req.params.brandId });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json({ name: doc.name, types: doc.types });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/brands/:brandId — create or update
router.put('/:brandId', adminAuth, async (req, res) => {
    try {
        const { name, models } = req.body;
        const doc = await Brand.findOneAndUpdate(
            { brandId: req.params.brandId },
            { name, types: req.body.types || {}, updatedAt: new Date() },
            { upsert: true, returnDocument: 'after' }
        );
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/brands/:brandId
router.delete('/:brandId', adminAuth, async (req, res) => {
    try {
        await Brand.deleteOne({ brandId: req.params.brandId });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
