# OutboundAudit

OutboundAudit is a small single-page app that provides AI-powered audits of cold outreach emails.

Structure
- backend/
	- server.js
	- package.json
	- .env.example
- frontend/
	- index.html
	- package.json
	- vite.config.js
	- src/
		- main.jsx
		- App.jsx

Quickstart (development)

1. Backend

```bash
cd outbound-audit/backend
npm install
cp .env.example .env
# set ANTHROPIC_API_KEY in .env
npm start
```

2. Frontend

```bash
cd outbound-audit/frontend
npm install
npm run dev
```

Notes
- The backend expects `ANTHROPIC_API_KEY` to be set in the environment.
- Vite dev server proxies `/api` to the backend at `http://localhost:3001`.
- For production deploy, host the backend on a secure server (Render, Railway, Vercel Serverless, or Supabase Edge Functions) and ensure the API key remains secret.

