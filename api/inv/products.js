const express = require('express');
const router = express.Router();
const Product = require('../../models/inv/Product');
const { jwtAuth, requireRole } = require('../../middleware/inv-auth');
const { validateSku, validateRequiredFields } = require('../../utils/inv-validators');
const { calculateMarginVat } = require('../../utils/inv-vat-calculator');

// All routes require Staff+ access
router.use(jwtAuth, requireRole('admin', 'staff'));

// ─── Category attribute templates ───────────────────────────────────────────
const CATEGORY_TEMPLATES = {
  '二手手机': { '成色': '', '电池健康度': '', '维修记录': '' },
  '配件': { '材质': '', '适配机型': '' },
  '平板': { '成色': '', '存储容量': '' }
};

// ─── GET /api/inv/products/search ───────────────────────────────────────────
// Fuzzy search by name/SKU/IMEI (case-insensitive)
// Must be defined BEFORE /:id to avoid route conflict
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.json([]);
    }

    const keyword = q.trim();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'i');

    const products = await Product.find({
      active: true,
      $or: [
        { name: regex },
        { sku: regex },
        { serialNumber: regex }
      ]
    }).limit(50).sort({ updatedAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/products/templates ────────────────────────────────────────
// Return category attribute templates; unknown categories get empty object
router.get('/templates', (req, res) => {
  const { category } = req.query;
  if (category) {
    return res.json(CATEGORY_TEMPLATES[category] || {});
  }
  res.json(CATEGORY_TEMPLATES);
});

// ─── GET /api/inv/products ──────────────────────────────────────────────────
// Product list with pagination, category filter, active filter
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Active filter
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    // Keyword search filter (name, SKU, serialNumber)
    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim() !== '') {
      const keyword = req.query.q.trim();
      const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedKw, 'i');
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { serialNumber: searchRegex }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ updatedAt: -1 }),
      Product.countDocuments(filter)
    ]);

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── GET /api/inv/products/:id ──────────────────────────────────────────────
// Product detail with all custom attributes
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const result = product.toObject();

    // For second-hand products, display margin info
    if (result.isSecondHand) {
      result.margin = Math.round((result.sellingPrice - result.costPrice) * 100) / 100;
      result.marginVat = calculateMarginVat(result.sellingPrice, result.costPrice);
    }

    res.json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── POST /api/inv/products ─────────────────────────────────────────────────
// Create product
router.post('/', async (req, res) => {
  try {
    const {
      name, sku, category, costPrice, sellingPrice,
      stock, isSecondHand, serialNumber, attributes,
      lowStockThreshold
    } = req.body;

    // Required fields validation
    const missing = validateRequiredFields(req.body, ['name', 'sku', 'sellingPrice']);
    if (missing.length > 0) {
      return res.status(400).json({
        error: `缺少必填字段：${missing.join('、')}`,
        fields: missing
      });
    }

    // costPrice is required (min 0)
    if (costPrice === undefined || costPrice === null) {
      return res.status(400).json({
        error: '缺少必填字段：costPrice',
        fields: ['costPrice']
      });
    }
    if (typeof costPrice !== 'number' || costPrice < 0) {
      return res.status(400).json({ error: '成本价必须为非负数' });
    }

    // Category is required
    if (!category || (typeof category === 'string' && category.trim() === '')) {
      return res.status(400).json({
        error: '缺少必填字段：category',
        fields: ['category']
      });
    }

    // SKU format validation
    const skuCheck = validateSku(sku);
    if (!skuCheck.valid) {
      return res.status(400).json({ error: skuCheck.error });
    }

    // SKU uniqueness check
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ error: 'SKU 已存在', code: 'SKU_DUPLICATE' });
    }

    // Second-hand product: serialNumber is required
    if (isSecondHand && (!serialNumber || (typeof serialNumber === 'string' && serialNumber.trim() === ''))) {
      return res.status(400).json({
        error: '二手商品必须提供序列号（IMEI/SN）',
        code: 'SERIAL_REQUIRED'
      });
    }

    // Non-second-hand products cannot have isSecondHand flag
    // (isSecondHand binds to Margin VAT — this is enforced by the schema default)

    // Build product data
    const productData = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      costPrice,
      sellingPrice,
      stock: stock || 0,
      isSecondHand: !!isSecondHand,
      active: true
    };

    if (serialNumber) productData.serialNumber = serialNumber.trim();
    if (attributes) productData.attributes = attributes;
    if (lowStockThreshold !== undefined) productData.lowStockThreshold = lowStockThreshold;

    const product = await Product.create(productData);

    const result = product.toObject();

    // For second-hand products, include margin info in response
    if (result.isSecondHand) {
      result.margin = Math.round((result.sellingPrice - result.costPrice) * 100) / 100;
      result.marginVat = calculateMarginVat(result.sellingPrice, result.costPrice);
    }

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'SKU 已存在', code: 'SKU_DUPLICATE' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('；') });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/products/:id ──────────────────────────────────────────────
// Edit product, preserve updatedAt timestamp
router.put('/:id', async (req, res) => {
  try {
    const {
      name, sku, category, costPrice, sellingPrice,
      stock, isSecondHand, serialNumber, attributes,
      lowStockThreshold, active
    } = req.body;

    const updateFields = {};

    if (name !== undefined) updateFields.name = name.trim();
    if (category !== undefined) updateFields.category = category.trim();
    if (costPrice !== undefined) {
      if (typeof costPrice !== 'number' || costPrice < 0) {
        return res.status(400).json({ error: '成本价必须为非负数' });
      }
      updateFields.costPrice = costPrice;
    }
    if (sellingPrice !== undefined) updateFields.sellingPrice = sellingPrice;
    if (stock !== undefined) updateFields.stock = stock;
    if (isSecondHand !== undefined) updateFields.isSecondHand = isSecondHand;
    if (serialNumber !== undefined) updateFields.serialNumber = serialNumber.trim();
    if (attributes !== undefined) updateFields.attributes = attributes;
    if (lowStockThreshold !== undefined) updateFields.lowStockThreshold = lowStockThreshold;
    if (active !== undefined) updateFields.active = active;

    // SKU update with format validation and uniqueness check
    if (sku !== undefined) {
      const skuCheck = validateSku(sku);
      if (!skuCheck.valid) {
        return res.status(400).json({ error: skuCheck.error });
      }
      // Check uniqueness (exclude current product)
      const existingSku = await Product.findOne({ sku, _id: { $ne: req.params.id } });
      if (existingSku) {
        return res.status(400).json({ error: 'SKU 已存在', code: 'SKU_DUPLICATE' });
      }
      updateFields.sku = sku.trim();
    }

    // If updating to second-hand, serialNumber is required
    if (updateFields.isSecondHand === true) {
      // Check if serialNumber is being provided in this update or already exists
      const currentProduct = await Product.findById(req.params.id);
      if (!currentProduct) {
        return res.status(404).json({ error: '商品不存在' });
      }
      const effectiveSerial = updateFields.serialNumber !== undefined
        ? updateFields.serialNumber
        : currentProduct.serialNumber;
      if (!effectiveSerial || effectiveSerial.trim() === '') {
        return res.status(400).json({
          error: '二手商品必须提供序列号（IMEI/SN）',
          code: 'SERIAL_REQUIRED'
        });
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: '没有提供需要更新的字段' });
    }

    // Preserve updatedAt timestamp
    updateFields.updatedAt = new Date();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const result = product.toObject();

    // For second-hand products, include margin info
    if (result.isSecondHand) {
      result.margin = Math.round((result.sellingPrice - result.costPrice) * 100) / 100;
      result.marginVat = calculateMarginVat(result.sellingPrice, result.costPrice);
    }

    res.json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '商品不存在' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'SKU 已存在', code: 'SKU_DUPLICATE' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('；') });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

// ─── PUT /api/inv/products/:id/disable ──────────────────────────────────────
// Soft delete (mark as inactive)
router.put('/:id/disable', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json(product);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: '商品不存在' });
    }
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
