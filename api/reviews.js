const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

function adminAuth(req, res, next) {
    if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// GET /api/reviews — public, only approved reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 }).limit(50);
        res.json(reviews);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reviews/all — admin, all reviews
router.get('/all', adminAuth, async (req, res) => {
    try {
        const reviews = await Review.find({}).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/reviews — public, submit a review
router.post('/', async (req, res) => {
    try {
        const { name, rating, message } = req.body;
        if (!name || !rating || !message) return res.status(400).json({ error: 'All fields required' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
        const review = await Review.create({ name: name.trim(), rating, message: message.trim() });
        res.json({ success: true, message: 'Thank you! Your review will appear after approval.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/reviews/:id/approve — admin, approve a review
router.put('/:id/approve', adminAuth, async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { approved: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/reviews/:id/reject — admin, unapprove a review
router.put('/:id/reject', adminAuth, async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { approved: false });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/reviews/:id — admin, delete a review
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
