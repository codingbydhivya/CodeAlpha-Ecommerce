const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

// POST /api/orders  { items: [{ productId, quantity }], shippingAddress }
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Your cart is empty.'),
    body('items.*.productId').custom((v) => mongoose.isValidObjectId(v)).withMessage('Invalid product in cart.'),
    body('items.*.quantity').isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20.'),
    body('shippingAddress').trim().isLength({ min: 10, max: 300 }).withMessage('Please enter a full shipping address (10+ characters).')
  ],
  validate,
  async (req, res, next) => {
    const reserved = []; // for rollback if a later item fails
    try {
      // Merge duplicate product ids
      const merged = new Map();
      for (const it of req.body.items) {
        merged.set(it.productId, (merged.get(it.productId) || 0) + Number(it.quantity));
      }

      const lines = [];
      for (const [productId, quantity] of merged) {
        // Atomic stock decrement: only succeeds if enough stock remains
        const product = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true }
        );
        if (!product) {
          const existing = await Product.findById(productId);
          const msg = existing
            ? `Only ${existing.stock} left of "${existing.name}".`
            : 'A product in your cart no longer exists.';
          throw Object.assign(new Error(msg), { status: 409 });
        }
        reserved.push({ productId, quantity });
        // Price always comes from the database, never from the client
        lines.push({ product: product._id, name: product.name, image: product.image, price: product.price, quantity });
      }

      const totalAmount = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
      const order = await Order.create({
        user: req.user._id,
        products: lines,
        totalAmount,
        shippingAddress: req.body.shippingAddress
      });
      res.status(201).json({ order });
    } catch (err) {
      // Roll back any stock we already reserved
      await Promise.all(
        reserved.map((r) => Product.updateOne({ _id: r.productId }, { $inc: { stock: r.quantity } }))
      ).catch(() => {});
      next(err);
    }
  }
);

// GET /api/orders  (order history of the logged-in user)
router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ orderDate: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found.' });
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
