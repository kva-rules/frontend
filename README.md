# Frontend (Ticketing SPA)

React 18 single-page app that talks to the backend exclusively through the **API Gateway** at port 8080. Auth, tickets, solutions, knowledge base, leaderboard, and notifications — all of it lives here. Styled with TailwindCSS, bundled by Vite 5, state via Redux Toolkit.

---

## At a glance
| | |
|---|---|
| **Port (dev)** | 3000 (Vite dev server) |
| **Port (docker/k8s)** | 3000 (nginx serving built `dist/`) |
| **API target** | Gateway `http://localhost:8080` (dev proxy) / `http://ticketing.local/api` (k8s) |
| **Node** | 18+ |
| **Router** | react-router-dom 6.21 |
| **State** | Redux Toolkit 2.0 + react-redux 9.0 |
| **HTTP** | axios 1.6 (with JWT interceptor) |
| **Styling** | TailwindCSS 3.4 |
| **Build** | Vite 5.0 |

---

## What it does
- **Auth** — login / register / logout, stores JWT in `localStorage`, decodes with `jwt-decode` to extract `userId`, `email`, `role`.
- **Dashboard** — open-ticket count, recent notifications, top-5 leaderboard.
- **Tickets** — list + filter, create, detail view with comments/contributors/ratings.
- **Solutions** — submit, view, approve/reject (managers), vote.
- **Knowledge base** — browse, search, view one article.
- **Notifications** — list + unread-count badge.
- **Leaderboard** — global ranking of contributors.

---

## Project structure
```
frontend/
├── index.html              # SPA entry (Vite)
├── vite.config.js          # Dev server port 3000, /api → :8080 proxy
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── Dockerfile              # Multi-stage: node build → nginx serve
├── nginx.conf              # SPA fallback + /api → api-gateway:8080 proxy
└── src/
    ├── main.jsx            # ReactDOM root + <BrowserRouter>
    ├── App.jsx             # Route table
    ├── index.css           # Tailwind directives
    ├── api/
    │   ├── axiosConfig.js  # Base URL + JWT interceptor + 401 handler
    │   ├── authApi.js
    │   ├── userApi.js
    │   ├── ticketApi.js
    │   ├── solutionApi.js
    │   ├── knowledgeApi.js
    │   ├── rewardApi.js
    │   └── notificationApi.js
    ├── components/
    │   ├── Navbar.jsx
    │   └── ProtectedRoute.jsx  # redirects to /login if !isAuthenticated
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── TicketListPage.jsx
    │   ├── TicketDetailPage.jsx
    │   ├── CreateTicketPage.jsx
    │   ├── SolutionsPage.jsx
    │   ├── SolutionDetailPage.jsx
    │   ├── KnowledgeBasePage.jsx
    │   ├── KnowledgeArticlePage.jsx
    │   ├── NotificationsPage.jsx
    │   └── LeaderboardPage.jsx
    └── store/
        ├── index.js         # configureStore
        └── slices/
            ├── authSlice.js
            ├── ticketSlice.js
            ├── notificationSlice.js
            └── rewardSlice.js
```

---

## How the API layer works

### Axios config (`src/api/axiosConfig.js`)
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://ticketing.local/api';

// Request: attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: on 401 → clear auth + redirect to /login
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### Dev proxy (`vite.config.js`)
```javascript
server: {
  port: 3000,
  proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
}
```
So in dev you hit `/api/tickets` on the Vite server and it's forwarded to the gateway on `:8080`. No CORS headache.

---

## Redux slices

| Slice | Shape |
|---|---|
| **auth** | `{ user: {userId, email, role}, token, isAuthenticated, loading, error }` |
| **ticket** | `{ tickets, selectedTicket, loading, error, totalCount }` |
| **notification** | `{ notifications, unreadCount, loading, error }` |
| **reward** | `{ leaderboard, myPoints, loading, error }` |

Each slice uses `createSlice` + `createAsyncThunk` for side effects. Entry points in `store/index.js` compose them via `configureStore`.

---

## Routing

| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | public |
| `/register` | `RegisterPage` | public |
| `/dashboard` | `DashboardPage` | ProtectedRoute |
| `/tickets` | `TicketListPage` | ProtectedRoute |
| `/tickets/new` | `CreateTicketPage` | ProtectedRoute |
| `/tickets/:id` | `TicketDetailPage` | ProtectedRoute |
| `/solutions` | `SolutionsPage` | ProtectedRoute |
| `/solutions/:id` | `SolutionDetailPage` | ProtectedRoute |
| `/knowledge` | `KnowledgeBasePage` | ProtectedRoute |
| `/knowledge/:id` | `KnowledgeArticlePage` | ProtectedRoute |
| `/notifications` | `NotificationsPage` | ProtectedRoute |
| `/leaderboard` | `LeaderboardPage` | ProtectedRoute |

---

## End-to-end demo flow
1. **Register** two users: one `ADMIN`, one `USER`.
2. **Login** as the user → JWT stored → Dashboard renders.
3. **Create a ticket** → gateway routes to `ticket-service` → Kafka `ticket.created` → notification-service creates an in-app row.
4. Switch to **admin/manager** account → view ticket → add a **solution** → approve it.
5. Reward-service consumes `solution.approved` → awards +30 points → publishes `leaderboard.updated`.
6. **Leaderboard** page now shows the points; **Knowledge base** (if wired to knowledge-create pipeline) shows a new article.

---

## Local development
```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:3000
```

### Environment variables
`.env` or shell:
```
VITE_API_BASE_URL=http://localhost:8080/api    # override gateway base URL
```
Omitted → defaults to `http://ticketing.local/api` (suits k8s/ingress).

### Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server + HMR on :3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint (`--max-warnings 0`) |

### Stop the dev server
```bash
lsof -ti:3000 | xargs kill -9
```

---

## Docker
Multi-stage build (Node → Nginx):
```bash
docker build -t frontend:latest .
docker run --rm -p 3000:3000 frontend:latest
```
`nginx.conf` inside the image:
- Serves the SPA from `/usr/share/nginx/html` with a fallback to `index.html`.
- Proxies `/api/**` → `api-gateway:8080` (inside the Docker/k8s network).

---

## Kubernetes
- Manifest: `k8s/frontend.yaml` (Deployment + Service + part of the `ticketing.local` Ingress).
- Image pull policy `Never` (Docker Desktop).
- Access at `http://ticketing.local/` once `/etc/hosts` is mapped.

---

## Connectivity
```
┌──────────┐       ┌──────────┐       ┌────────────────────┐
│ Frontend │──────▶│ Gateway  │──────▶│ 7 backend services │
│ :3000    │ /api  │ :8080    │       │ :8081 … :8087      │
└──────────┘       └──────────┘       └────────────────────┘
  Vite dev            Spring Cloud     Postgres-per-service
  or nginx            Gateway          + Kafka
```

---

## Troubleshooting

**Login succeeds but subsequent calls return 401**
The token is probably expired or the `jwt.secret` drifted between gateway and backend. Decode the token at jwt.io and verify the `exp` claim is in the future.

**CORS error in the browser console**
Dev: use the Vite proxy (`/api/...`) instead of `http://localhost:8080/api/...` directly — the proxy masks CORS.
Deployed: ensure gateway `CorsConfig` whitelists your origin (see `api_gateway/README.md`).

**`npm run dev` port 3000 in use**
`lsof -ti:3000 | xargs kill -9` then re-run.

**Build warns about bundle size**
Pages are not code-split. If it matters, switch each route to `React.lazy()` + `<Suspense>`.

**Leaderboard / notifications empty after creating a ticket**
Check Kafka is running and the reward-service/notification-service containers are up. Tail `docker logs reward-service`.

---

## Tech stack
- React 18.2
- react-dom 18.2
- react-router-dom 6.21
- @reduxjs/toolkit 2.0, react-redux 9.0
- axios 1.6
- jwt-decode 4.0
- react-toastify 9.1
- TailwindCSS 3.4 + PostCSS + autoprefixer
- Vite 5.0 + @vitejs/plugin-react 4.2
- ESLint 8.55 (+ react / react-hooks plugins)
