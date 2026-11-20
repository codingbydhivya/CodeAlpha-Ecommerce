const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
      .matches(/[A-Za-z]/).withMessage('Password must contain a letter.')
      .matches(/\d/).withMessage('Password must contain a number.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (await User.findOne({ email })) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hash });
      res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      const ok = user && (await bcrypt.compare(password, user.password));
      if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });
      res.json({ token: signToken(user._id), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
