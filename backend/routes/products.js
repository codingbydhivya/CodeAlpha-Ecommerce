const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?search=&category=&sort=&featured=true&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { search, category, sort, featured } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = {};
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { category: rx }];
    }
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.featured = true;

    const sorts = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      name: { name: 1 },
      newest: { createdAt: -1 }
    };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sorts[sort] || { createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    res.json({ categories: (await Product.distinct('category')).sort() });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
