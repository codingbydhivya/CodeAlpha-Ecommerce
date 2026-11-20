/* Shared helpers: API client, auth, cart, toasts, header/footer, product cards */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NO_IMG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="100%" height="100%" fill="#eef0f4"/><text x="50%" y="50%" fill="#98a2b3" font-family="sans-serif" font-size="28" text-anchor="middle">No image</text></svg>');
const money = (n) => '$' + Number(n).toFixed(2);

/* ---------- Auth ---------- */
const Auth = {
  get token() { return localStorage.getItem('cs_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('cs_user')); } catch { return null; } },
  get loggedIn() { return !!this.token; },
  save(token, user) { localStorage.setItem('cs_token', token); localStorage.setItem('cs_user', JSON.stringify(user)); },
  logout() { localStorage.removeItem('cs_token'); localStorage.removeItem('cs_user'); }
};

/* ---------- API ---------- */
async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.token) headers.Authorization = 'Bearer ' + Auth.token;
  let res;
  try {
    res = await fetch(window.API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) { Auth.logout(); }
    const err = new Error(data.message || 'Something went wrong.');
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- Cart (localStorage) ---------- */
const Cart = {
  get items() { try { return JSON.parse(localStorage.getItem('cs_cart')) || []; } catch { return []; } },
  _save(items) { localStorage.setItem('cs_cart', JSON.stringify(items)); renderCartBadge(); },
  get count() { return this.items.reduce((s, i) => s + i.quantity, 0); },
  get total() { return this.items.reduce((s, i) => s + i.price * i.quantity, 0); },
  add(product, qty = 1) {
    const items = this.items;
    const found = items.find((i) => i.productId === product._id);
    const max = product.stock;
    const next = (found ? found.quantity : 0) + qty;
    if (next > max) { toast(`Only ${max} in stock.`, 'error'); return false; }
    if (found) { found.quantity = next; found.stock = max; }
    else items.push({ productId: product._id, name: product.name, price: product.price, image: product.image, stock: max, quantity: qty });
    this._save(items);
    return true;
  },
  setQty(id, qty) {
    let items = this.items;
    const it = items.find((i) => i.productId === id);
    if (!it) return;
    if (qty <= 0) items = items.filter((i) => i.productId !== id);
    else if (qty > it.stock) { toast(`Only ${it.stock} in stock.`, 'error'); return; }
    else it.quantity = qty;
    this._save(items);
  },
  remove(id) { this._save(this.items.filter((i) => i.productId !== id)); },
  clear() { this._save([]); }
};

/* ---------- Toasts ---------- */
function toast(msg, type = 'info') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function showAlert(el, msg, type = 'error') {
  el.className = 'alert show ' + type;
  el.textContent = msg;
}

/* ---------- Header / footer ---------- */
function renderHeader() {
  const host = $('#site-header');
  if (!host) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  const link = (href, label) => `<li><a href="${href}" class="${page === href ? 'active' : ''}">${label}</a></li>`;
  const q = new URLSearchParams(location.search).get('search') || '';
  host.className = 'site-header';
  host.innerHTML = `
    <div class="container nav">
      <a href="index.html" class="logo">Shop<span>Hub</span></a>
      <form class="search-form" id="search-form" role="search">
        <input type="search" id="search-input" placeholder="Search products…" value="${esc(q)}" aria-label="Search products" />
        <button type="submit">Search</button>
      </form>
      <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">☰</button>
      <ul class="nav-links" id="nav-links">
        ${link('index.html', 'Home')}
        ${link('products.html', 'Products')}
        <li><a href="cart.html" class="${page === 'cart.html' ? 'active' : ''}">Cart<span class="cart-badge" id="cart-badge">0</span></a></li>
        ${Auth.loggedIn
          ? `${link('orders.html', 'My Orders')}<li><button id="logout-btn">Logout (${esc(Auth.user?.name?.split(' ')[0] || 'me')})</button></li>`
          : `${link('login.html', 'Login')}`}
      </ul>
    </div>`;
  $('#menu-toggle').onclick = () => $('#nav-links').classList.toggle('open');
  $('#search-form').onsubmit = (e) => {
    e.preventDefault();
    const v = $('#search-input').value.trim();
    location.href = 'products.html' + (v ? '?search=' + encodeURIComponent(v) : '');
  };
  const lo = $('#logout-btn');
  if (lo) lo.onclick = () => { Auth.logout(); toast('Logged out.', 'success'); setTimeout(() => (location.href = 'index.html'), 500); };
  renderCartBadge();
}

function renderCartBadge() {
  const b = $('#cart-badge');
  if (b) b.textContent = Cart.count;
}

function renderFooter() {
  const f = $('#site-footer');
  if (f) { f.className = 'site-footer'; f.innerHTML = `<div class="container">© ${new Date().getFullYear()} ShopHub · CodeAlpha Internship Project</div>`; }
}

/* ---------- Product card ---------- */
function productCard(p) {
  const out = p.stock <= 0;
  return `
    <article class="card">
      <a class="card-img" href="product.html?id=${p._id}">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src=NO_IMG" />
        <span class="tag">${esc(p.category)}</span>
        ${out ? '<span class="tag out">Out of stock</span>' : ''}
      </a>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <span class="price">${money(p.price)}</span>
        <p class="desc">${esc(p.description)}</p>
        <div class="card-actions">
          <a class="btn btn-outline" href="product.html?id=${p._id}">View Details</a>
          <button class="btn btn-primary add-to-cart" data-id="${p._id}" ${out ? 'disabled' : ''}>Add to Cart</button>
        </div>
      </div>
    </article>`;
}

// Wire up "Add to Cart" buttons inside a container, given the list of products rendered there
function bindAddToCart(root, products) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const p = products.find((x) => x._id === btn.dataset.id);
    if (p && Cart.add(p, 1)) toast(`Added "${p.name}" to cart.`, 'success');
  });
}

function skeletons(n = 4) { return Array.from({ length: n }, () => '<div class="skeleton"></div>').join(''); }

document.addEventListener('DOMContentLoaded', () => { renderHeader(); renderFooter(); });
