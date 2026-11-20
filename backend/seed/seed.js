require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const img = (seed) => `https://picsum.photos/seed/${seed}/600/450`;

const products = [
  { name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life. Soft memory-foam ear cushions, built-in microphone for calls, and fast USB-C charging that gives 5 hours of playback from a 10 minute charge.', price: 129.99, image: img('headphones'), category: 'Electronics', stock: 25, featured: true },
  { name: 'Smart Fitness Watch', description: 'Track heart rate, sleep, steps and 20+ workout modes. Water resistant to 50 metres with a bright AMOLED display and a 7-day battery. Syncs with iOS and Android.', price: 89.5, image: img('smartwatch'), category: 'Electronics', stock: 40, featured: true },
  { name: 'Portable Bluetooth Speaker', description: 'Compact waterproof speaker with deep bass and 12 hours of playtime. Pair two speakers together for stereo sound.', price: 45, image: img('speaker'), category: 'Electronics', stock: 60, featured: false },
  { name: 'Mechanical Keyboard', description: 'Hot-swappable mechanical keyboard with tactile switches, per-key RGB lighting and an aluminium top plate. Works wired or over Bluetooth.', price: 74.99, image: img('keyboard'), category: 'Electronics', stock: 30, featured: true },
  { name: 'Classic Denim Jacket', description: 'A timeless mid-wash denim jacket cut from sturdy cotton with a comfortable regular fit. Layer it over a tee or a hoodie all year round.', price: 59.99, image: img('denim'), category: 'Fashion', stock: 35, featured: false },
  { name: 'Running Sneakers', description: 'Lightweight breathable running shoes with responsive cushioning and a grippy rubber outsole. Built for daily training and weekend races.', price: 79, image: img('sneakers'), category: 'Fashion', stock: 50, featured: true },
  { name: 'Leather Crossbody Bag', description: 'Genuine leather crossbody bag with an adjustable strap, zip closure and two inner pockets. Compact but fits a phone, wallet and keys comfortably.', price: 64.25, image: img('leatherbag'), category: 'Fashion', stock: 20, featured: false },
  { name: 'Stainless Steel Water Bottle', description: 'Double-wall vacuum insulated bottle that keeps drinks cold for 24 hours or hot for 12. BPA-free, leak-proof lid, 750 ml.', price: 22.99, image: img('bottle'), category: 'Home & Kitchen', stock: 100, featured: false },
  { name: 'Ceramic Coffee Mug Set', description: 'Set of four handmade-style ceramic mugs in earthy tones. Microwave and dishwasher safe, 350 ml each.', price: 28, image: img('mugs'), category: 'Home & Kitchen', stock: 45, featured: false },
  { name: 'Programmable Coffee Maker', description: 'Brew up to 10 cups with a programmable timer, reusable filter and auto keep-warm plate. Easy-fill water window and drip-stop.', price: 54.9, image: img('coffeemaker'), category: 'Home & Kitchen', stock: 18, featured: true },
  { name: 'Yoga Mat with Strap', description: 'Non-slip 6 mm thick yoga mat with alignment lines and a carry strap. Cushions joints while keeping a firm grip.', price: 24.5, image: img('yogamat'), category: 'Sports', stock: 70, featured: false },
  { name: 'Adjustable Dumbbell Pair', description: 'Space-saving adjustable dumbbells from 2 kg to 12 kg each. Quick-lock dial lets you change weight in seconds.', price: 119, image: img('dumbbells'), category: 'Sports', stock: 12, featured: false },
  { name: 'Hardcover Notebook Bundle', description: 'Three dotted-grid hardcover notebooks with 120 gsm paper, ribbon bookmarks and elastic closures. Ink-friendly and great for journaling.', price: 19.99, image: img('notebooks'), category: 'Stationery', stock: 80, featured: false },
  { name: 'LED Desk Lamp', description: 'Dimmable LED desk lamp with 5 colour temperatures, USB charging port and a flexible neck. Eye-friendly, flicker-free light.', price: 34.99, image: img('desklamp'), category: 'Home & Kitchen', stock: 0, featured: false }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codealpha_store');
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
