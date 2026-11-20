// Backend API base URL.
// - Frontend served by the backend (SERVE_FRONTEND=true): same origin, so '' works via the fallback below.
// - Frontend served separately (Live Server / `npx serve`): points at the API on port 5000.
window.API_BASE =
  window.location.port === '5000' ? '/api' : 'http://localhost:5000/api';
