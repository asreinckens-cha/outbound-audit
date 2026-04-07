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
- The frontend can use `frontend/.env.example` to set `VITE_API_URL` for local development.

## Supabase deployment

This project can be deployed to Supabase using static site hosting for the frontend and an Edge Function for the AI backend.

### 1. Install the Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase in the project

```bash
cd outbound-audit
supabase init
```

### 3. Add the Edge Function

Place the function code in `supabase/functions/evaluate/index.ts`.

### 4. Set the Anthropic key as a secret

```bash
cd outbound-audit
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 5. Build the frontend

```bash
cd outbound-audit/frontend
npm install
npm run build
```

### 6. Deploy to Supabase

```bash
cd outbound-audit
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy evaluate --project-ref <your-project-ref>
supabase site deploy ./frontend/dist --project-ref <your-project-ref>
```

### 7. Set the frontend API endpoint for production

On Supabase, the Edge Function will be available at `/functions/v1/evaluate`.
- Set `VITE_API_URL=/functions/v1/evaluate` before building the frontend for production.
- In local dev, `frontend/.env.example` keeps the API URL as `/api/evaluate`.

With this setup, the API key remains on the Supabase backend only, and the frontend calls the secure Edge Function.

