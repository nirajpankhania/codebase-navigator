# Codebase Navigator

An AI-powered tool that lets you chat with any public GitHub repository. Paste a URL, wait for it to be indexed, then ask questions in plain English — "how does authentication work?", "what are the main entry points?", "walk me through the request lifecycle."

> **Live demo:** _coming soon_

---

## What it does

Most developers read code by jumping between files, grepping for symbols, and slowly building a mental model. Codebase Navigator skips that. It reads every source file in a repo, breaks it into overlapping chunks, turns each chunk into a vector embedding (a list of numbers that captures meaning), and stores everything in a database. When you ask a question, it finds the most relevant chunks using vector similarity search and feeds them to an LLM — which answers based only on the actual code, not hallucinated knowledge.

This is called **Retrieval-Augmented Generation (RAG)**.

---

## Architecture

```
Browser
  │
  ├─ Landing page: user pastes a GitHub URL
  │     │
  │     └─ POST /api/ingest  ──►  FastAPI backend
  │                                    │
  │                                    ├─ GitHub API: fetch file tree
  │                                    ├─ raw.githubusercontent.com: fetch each file
  │                                    ├─ tiktoken: split files into 400-token chunks
  │                                    ├─ OpenAI text-embedding-3-small: embed each chunk
  │                                    └─ Supabase (pgvector): store chunk + embedding
  │
  ├─ Chat page: polls GET /api/status/{repo_id} until indexing is done
  │
  └─ Chat page: user asks a question
        │
        └─ POST /api/chat  ──►  FastAPI backend
                                    │
                                    ├─ OpenAI text-embedding-3-small: embed the question
                                    ├─ Supabase match_chunks RPC: find top 10 similar chunks
                                    │   + second search anchored on README/overview content
                                    ├─ GPT-4o-mini: answer using retrieved chunks as context
                                    └─ Response: answer + list of source files cited
```

The frontend never talks to OpenAI or Supabase directly — everything goes through the FastAPI backend.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS | Type safety, server components, easy Vercel deploy |
| Backend | FastAPI (Python 3.11) | Async-native, fast, great OpenAI SDK support |
| Database | Supabase (Postgres + pgvector) | Vector similarity search at zero cost |
| Embeddings | OpenAI `text-embedding-3-small` | Better than ada-002, cheaper |
| Chat | OpenAI `gpt-4o-mini` | Sufficient quality at a fraction of GPT-4o cost |
| Deployment | Vercel (frontend) + Render (backend) | Free tiers, simple CI |

---

## File structure

```
codebase-navigator/
│
├── backend/
│   ├── main.py                   # FastAPI app entry point — registers all routers and CORS
│   ├── requirements.txt          # Python dependencies
│   │
│   ├── routes/
│   │   ├── ingest.py             # POST /api/ingest — validates URL, fires background ingestion, returns repo_id immediately
│   │   ├── chat.py               # POST /api/chat — takes a question + repo_id, returns answer + sources
│   │   └── status.py             # GET /api/status/{repo_id} — returns current ingestion progress
│   │
│   ├── services/
│   │   ├── ingestion.py          # Core ingestion pipeline: fetch → chunk → embed → store
│   │   ├── embedding.py          # Thin wrapper around OpenAI embeddings API (batched)
│   │   ├── rag.py                # RAG pipeline: embed question → similarity search → GPT answer
│   │   └── progress.py           # In-memory store for ingestion progress state per repo_id
│   │
│   ├── db/
│   │   ├── client.py             # Supabase client singleton
│   │   └── queries.py            # insert_chunks() and similarity_search() — all DB access lives here
│   │
│   └── models/
│       └── schemas.py            # Pydantic request/response models for all endpoints
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — sets fonts and global styles
│   │   ├── page.tsx              # Landing page — hero, repo URL form, "how it works" section
│   │   └── chat/[repoId]/
│   │       └── page.tsx          # Chat page — header with repo name, wraps ChatInterface in IngestionGate
│   │
│   ├── components/
│   │   ├── RepoForm.tsx          # URL input form — calls ingestRepo(), redirects immediately to chat page
│   │   ├── ParticleCanvas.tsx    # Animated particle background on the landing page
│   │   ├── IngestionGate.tsx     # Polls /api/status every 2s, shows step-by-step progress until done
│   │   └── ChatInterface.tsx     # Full chat UI — sends messages, renders markdown responses, shows source chips
│   │
│   └── lib/
│       └── api.ts                # All fetch calls to the backend — ingestRepo(), sendMessage(), getIngestionStatus()
│
├── supabase/
│   └── schema.sql                # Run once in Supabase SQL editor to create the chunks table and match_chunks function
│
└── CLAUDE.md                     # AI assistant context for this project
```

---

## How the pieces connect

### Ingestion flow

1. `RepoForm.tsx` calls `ingestRepo()` in `lib/api.ts`, which POSTs to `/api/ingest`
2. `routes/ingest.py` generates a random `repo_id`, writes `"pending"` to the progress store, and fires `ingest_repo()` as a FastAPI background task — returning the `repo_id` to the frontend immediately
3. `services/ingestion.py` runs the pipeline:
   - Hits the GitHub API to get the full file tree, filtered to supported extensions (`.py`, `.ts`, `.js`, `.md`, etc.) and skipping junk directories (`node_modules`, `.venv`, `dist`, etc.)
   - Fetches each file from `raw.githubusercontent.com` with up to 10 concurrent requests
   - Splits each file into 400-token chunks with 50-token overlap using tiktoken (so context isn't lost at chunk boundaries)
   - Writes progress updates throughout: `"fetching"` → `"embedding"` → `"storing"` → `"done"`
4. `services/embedding.py` sends all chunks to `text-embedding-3-small` in batches of 512
5. `db/queries.py` inserts each chunk (file path + content + 1536-dimensional embedding vector) into Supabase in batches of 100

### Progress tracking

- `services/progress.py` is a simple in-memory Python dict: `{ repo_id: { status, message } }`
- `routes/status.py` reads from it — returns `"ready"` for unknown repo IDs (i.e. repos ingested in a previous server session that are still in Supabase)
- `IngestionGate.tsx` polls this endpoint every 2 seconds and renders a step indicator until status is `"done"` or `"ready"`, then unmounts and shows the chat interface

### Chat / RAG flow

1. `ChatInterface.tsx` calls `sendMessage()` in `lib/api.ts`, which POSTs to `/api/chat`
2. `routes/chat.py` delegates to `services/rag.py`
3. `rag.py` runs two parallel similarity searches:
   - One for the user's question directly
   - One anchored on a broad "project overview readme description" query — so questions like "what does this repo do?" always pull in README content
   - Results are deduplicated and combined (up to ~14 chunks total)
4. The chunks are formatted as context and sent to `gpt-4o-mini` with a system prompt that instructs it to answer only from the provided code — not from prior knowledge
5. The response comes back with an `answer` string and a `sources` array (file paths + snippets)
6. `ChatInterface.tsx` renders the answer with `react-markdown` (so code blocks, bold text etc. look right) and shows the source files as small chips below each message

---

## Local setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- An [OpenAI](https://platform.openai.com) API key
- Optionally: a GitHub personal access token (raises rate limit from 60 to 5000 req/hour)

### 1. Database setup

In your Supabase dashboard, go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates:
- A `chunks` table with `repo_id`, `file_path`, `content`, and an `embedding` vector column
- An HNSW index on the embedding column for fast similarity search
- A `match_chunks` Postgres function used for vector search via Supabase RPC

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GITHUB_TOKEN=ghp_...          # optional but recommended
```

> **Important:** `SUPABASE_URL` must be the bare project URL — no `/rest/v1/` suffix.

Start the server:
```bash
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Environment variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | backend `.env` | Yes | Used for embeddings and chat |
| `SUPABASE_URL` | backend `.env` | Yes | Bare project URL, e.g. `https://abc.supabase.co` |
| `SUPABASE_SERVICE_KEY` | backend `.env` | Yes | Service role key — bypasses RLS |
| `GITHUB_TOKEN` | backend `.env` | No | Personal access token — increases API rate limit |
| `NEXT_PUBLIC_API_URL` | frontend `.env.local` | Yes | URL of the FastAPI backend |

---

## Supported file types

The ingestion pipeline indexes these extensions:

`.py` `.ts` `.tsx` `.js` `.jsx` `.md` `.txt` `.json` `.yaml` `.yml` `.toml` `.go` `.rs` `.java` `.rb` `.php` `.c` `.cpp` `.h` `.cs` `.html` `.css` `.scss` `.sh`

Files over 200KB and directories like `node_modules`, `.venv`, `dist`, `build`, `.next`, and `.git` are skipped automatically.

---

## Roadmap

- [ ] D3.js interactive architecture graph — visualise the repo's file/module structure
- [ ] Auto-generated README — produce a structured summary of any ingested repo
- [ ] Deduplication — re-ingesting the same URL reuses the existing repo_id instead of creating duplicate rows
- [ ] Deployment — Vercel (frontend) + Render (backend)
