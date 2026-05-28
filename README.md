# Codebase Navigator

An AI-powered tool that lets you chat with any public GitHub repository. Paste a URL, wait for it to be indexed, then ask questions in plain English — "how does authentication work?", "what are the main entry points?", "walk me through the request lifecycle." You can also explore the repo's structure visually as an interactive graph.

> **Live demo:** [codebase-navigator-five.vercel.app](https://codebase-navigator-five.vercel.app)

---

## Motivation

With the prevalence of tools like claude code, you find that some people's workflow is very detached from the coding itself. You prompt, wait and then bulk review the changes (for some not even this step). For me that felt a bit too disconnected and i like the granularity of going back and forth implementing one change at a time. The alternative often is to use a chat window to assist with one thing at a time. Its slower and often time lacks an overall understanding of your code.

Also, with this alternative, you encounter another issue. Context fills up, once it finally does understand your code a chat may need to be started anew and re-educated to get up and running again. This felt slow and was a pain point for me. This friction feels especially bad when your deep in a session.

My answer was this. Something that gives AI a genuine semantic understanding of a codebase without it living amongst your files. You can index and ask, which is good for user understanding but also for any assisting agents.

---

## What it does

Codebase Navigator reads every source file in a repo, breaks it into overlapping chunks, turns each chunk into a vector embedding (a list of numbers that captures meaning), and stores everything in a database. When you ask a question, it finds the most relevant chunks using vector similarity search and feeds them to an LLM — which answers based only on the actual code, not hallucinated knowledge.

Alongside the chat interface, an interactive D3 graph lets you explore the repo's file and directory structure visually — color-coded by file type, with zoom, pan, drag, click-to-focus, and search.

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
  │                                    ├─ Delete existing chunks for this repo (deduplication)
  │                                    ├─ GitHub API: fetch file tree
  │                                    ├─ raw.githubusercontent.com: fetch each file
  │                                    ├─ tiktoken: split files into 400-token chunks
  │                                    ├─ OpenAI text-embedding-3-small: embed each chunk
  │                                    └─ Supabase (pgvector): store chunk + embedding
  │
  ├─ Chat page: polls GET /api/status/{repo_id} until indexing is done
  │
  ├─ Chat page: user asks a question
  │     │
  │     └─ POST /api/chat  ──►  FastAPI backend
  │                                    │
  │                                    ├─ OpenAI text-embedding-3-small: embed the question
  │                                    ├─ Supabase match_chunks RPC: find top 10 similar chunks
  │                                    │   + second search anchored on README/overview content
  │                                    ├─ GPT-4o-mini: answer using retrieved chunks as context
  │                                    └─ Response: answer + list of source files cited
  │
  └─ Architecture tab: GET /api/graph/{repo_id}
        │
        └─ FastAPI builds node/link tree from stored file paths
           D3.js renders force-directed graph in the browser
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
| Graph | D3.js | Force-directed layout, zoom/pan/drag, reactive filtering |
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
│   │   ├── status.py             # GET /api/status/{repo_id} — returns current ingestion progress
│   │   └── graph.py              # GET /api/graph/{repo_id} — builds node/link tree from stored file paths
│   │
│   ├── services/
│   │   ├── ingestion.py          # Core ingestion pipeline: fetch → chunk → embed → store
│   │   ├── embedding.py          # Thin wrapper around OpenAI embeddings API (batched)
│   │   ├── rag.py                # RAG pipeline: embed question → dual similarity search → GPT answer
│   │   └── progress.py           # In-memory store for ingestion progress state per repo_id
│   │
│   ├── db/
│   │   ├── client.py             # Supabase client singleton
│   │   └── queries.py            # delete_chunks(), insert_chunks(), get_file_paths(), similarity_search()
│   │
│   └── models/
│       └── schemas.py            # Pydantic request/response models for all endpoints
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — sets fonts and global styles
│   │   ├── page.tsx              # Landing page — hero, repo URL form, "how it works" section
│   │   └── chat/[repoId]/
│   │       └── page.tsx          # Chat page — header with repo name, wraps content in IngestionGate
│   │
│   ├── components/
│   │   ├── RepoForm.tsx          # URL input form — calls ingestRepo(), redirects immediately to chat page
│   │   ├── ParticleCanvas.tsx    # Animated particle background on the landing page
│   │   ├── IngestionGate.tsx     # Polls /api/status every 2s, shows step-by-step progress until done
│   │   ├── ChatPageContent.tsx   # Tab switcher between Chat and Architecture views
│   │   ├── ChatInterface.tsx     # Full chat UI — sends messages, renders markdown responses, shows source chips
│   │   └── RepoGraph.tsx         # D3 force-directed graph — color by extension, zoom/pan/drag/search/focus
│   │
│   └── lib/
│       └── api.ts                # All fetch calls to the backend
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
2. `routes/ingest.py` generates a stable `repo_id` (MD5 hash of the URL), writes `"pending"` to the progress store, and fires `ingest_repo()` as a FastAPI background task — returning the `repo_id` immediately
3. `services/ingestion.py` runs the pipeline:
   - Deletes any existing chunks for this `repo_id` first (so re-ingesting the same URL never creates duplicates)
   - Hits the GitHub API to get the full file tree, filtered to supported extensions and skipping junk directories
   - Fetches each file from `raw.githubusercontent.com` with up to 10 concurrent requests
   - Splits each file into 400-token chunks with 50-token overlap using tiktoken
   - Writes progress updates throughout: `"fetching"` → `"embedding"` → `"storing"` → `"done"`
4. `services/embedding.py` sends all chunks to `text-embedding-3-small` in batches of 512
5. `db/queries.py` inserts each chunk (file path + content + 1536-dimensional embedding vector) into Supabase in batches of 100

### Progress tracking

- `services/progress.py` is a simple in-memory Python dict: `{ repo_id: { status, message } }`
- `routes/status.py` reads from it — returns `"ready"` for unknown repo IDs (repos ingested in a previous server session that are still in Supabase)
- `IngestionGate.tsx` polls this endpoint every 2 seconds and renders a step indicator until status is `"done"` or `"ready"`, then unmounts and shows the main content

### Chat / RAG flow

1. `ChatInterface.tsx` calls `sendMessage()` in `lib/api.ts`, which POSTs to `/api/chat`
2. `routes/chat.py` delegates to `services/rag.py`
3. `rag.py` runs two parallel similarity searches:
   - One for the user's question directly
   - One anchored on a broad "project overview readme description" query — so questions like "what does this repo do?" always pull in README content
   - Results are deduplicated and combined (up to ~14 chunks total)
4. The chunks are formatted as context and sent to `gpt-4o-mini` with a system prompt that instructs it to answer only from the provided code
5. The response comes back with an `answer` string and a `sources` array (file paths + snippets)
6. `ChatInterface.tsx` renders the answer with `react-markdown` and shows source files as chips below each message

### Architecture graph

1. Switching to the Architecture tab calls `getGraph()` in `lib/api.ts`, which hits `GET /api/graph/{repo_id}`
2. `routes/graph.py` reads the distinct file paths already stored in Supabase and builds a node/link tree from them — no extra storage needed
3. `RepoGraph.tsx` renders this with D3 as a force-directed graph:
   - Nodes are color-coded by file extension, sized by type (root > directory > file)
   - Zoom, pan, and drag work out of the box
   - Clicking any node highlights its full subtree and ancestor path, dimming everything else
   - The search bar filters nodes by name in real time

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
| `ALLOWED_ORIGIN` | backend (Render env) | Production | Frontend URL — added to CORS allowed origins |

---

## Supported file types

The ingestion pipeline indexes these extensions:

`.py` `.ts` `.tsx` `.js` `.jsx` `.md` `.txt` `.json` `.yaml` `.yml` `.toml` `.go` `.rs` `.java` `.rb` `.php` `.c` `.cpp` `.h` `.cs` `.html` `.css` `.scss` `.sh`

Files over 200KB and directories like `node_modules`, `.venv`, `dist`, `build`, `.next`, and `.git` are skipped automatically.

---

## Roadmap

- [x] RAG chat pipeline with dual parallel search
- [x] Live ingestion progress indicator
- [x] D3 interactive architecture graph with search and click-to-focus
- [x] Deduplication — re-ingesting the same URL clears old data rather than stacking duplicates
- [x] Deployment — Vercel (frontend) + Render (backend)
- [ ] Auto-generated README — produce a structured summary of any ingested repo
- [ ] Private repo support via GitHub OAuth
