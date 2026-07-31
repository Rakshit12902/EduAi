<div align="center">

  <!-- HERO BANNER & LOGO -->
  <br />
  <a href="https://edu-ai-omega-roan.vercel.app/login">
    <img src="https://raw.githubusercontent.com/andreasbm/readme-template/master/assets/star.gif" width="30" height="30" />
    <img src="https://readme-typing-svg.demolab.com?font=Outfit&weight=700&size=36&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=600&height=70&lines=EduAI+%E2%80%94+RAG+Teaching+Assistant;Grounded+Document+AI+Workspace;Groq+%2B+Gemini+2.0+Dual+Engine;Qdrant+3072-Dim+Vector+Search" alt="EduAI Typing Header" />
  </a>

  <p align="center">
    <b>A next-generation, document-grounded AI learning platform designed to eliminate hallucinations using high-speed vector RAG, verifiable citations, and real-time SSE streaming.</b>
  </p>

  <p align="center">
    <a href="https://edu-ai-omega-roan.vercel.app/login">
      <img src="https://img.shields.io/badge/🚀_LAUNCH_LIVE_APP-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live App" />
    </a>
    <a href="https://github.com/Rakshit12902/EduAi">
      <img src="https://img.shields.io/badge/⭐_STAR_REPOSITORY-4F46E5?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" />
    </a>
  </p>

  <!-- TECH BADGE SUITE -->
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/FastAPI_0.111-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Qdrant_Vector_DB-C4342E?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
    <img src="https://img.shields.io/badge/Groq_LPU-FF6C37?style=for-the-badge" alt="Groq" />
    <img src="https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  </p>

  <sub>Architected & Crafted by <a href="https://github.com/Rakshit12902"><strong>Rakshit (@Rakshit12902)</strong></a></sub>

</div>

---

<div align="center">
  <h3>💡 Why EduAI? (The Difference)</h3>
</div>

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h4>❌ Standard AI Chatbots</h4>
      <ul>
        <li><b>Hallucinates facts</b> when asked about syllabus notes or textbook details.</li>
        <li>No source transparency or page verification.</li>
        <li>Generic static UI without personal theme styling.</li>
        <li>Single-point-of-failure LLM API dependence.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>⚡ EduAI Platform</h4>
      <ul>
        <li><b>100% Grounded Context</b>: Strictly cites pages & percentage match scores.</li>
        <li><b>Interactive Source Cards</b>: Instant text excerpt popover modals.</li>
        <li><b>Material Design 3 Theme Engine</b>: Dynamic color accent customization.</li>
        <li><b>Dual-LLM Fault Tolerance</b>: Groq LPU with automatic Gemini 2.0 Flash fallback.</li>
      </ul>
    </td>
  </tr>
</table>

---

## ⚡ Feature Highlights Showcase

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>💬 Workspace Chat & Stream Engine</h3>
      <p>Start asking questions right from the main dashboard. EduAI extracts the first 5 words of your question to automatically generate workspace titles, streaming tokens in real time via Server-Sent Events (SSE).</p>
      <ul>
        <li><b>Token-by-Token SSE Stream</b></li>
        <li><b>Reasoning Tag Filter</b> (Strips <code>&lt;think&gt;...&lt;/think&gt;</code>)</li>
        <li><b>Action Toolbar</b>: Copy, Edit, Regenerate, Thumbs Rating</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📄 Document RAG & Vector Pipeline</h3>
      <p>Drag and drop PDFs, Markdown, TXT files, or images into chat workspaces. EduAI parses text with PyMuPDF, chunks content, generates 3072-dimensional embeddings, and indexes them into Qdrant Cloud.</p>
      <ul>
        <li><b>PyMuPDF & LangChain Text Splitters</b></li>
        <li><b>Google <code>gemini-embedding-001</code> Vectors</b></li>
        <li><b>Multi-Tenant User & Workspace Metadata Filters</b></li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🎯 Transparent Citation Badges</h3>
      <p>Answers are tagged with clear visual status indicators:</p>
      <ul>
        <li>🟢 <code>Grounded in your documents</code> ($\ge 60\%$ relevance match)</li>
        <li>🟡 <code>General Knowledge</code> (No matching documents found)</li>
        <li><b>Interactive Source Cards</b>: View page numbers, match percentage, and click to reveal raw document excerpt popovers.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🎨 Custom Appearance & Accent Engine</h3>
      <p>Personalize your AI workspace to suit your focus aesthetic:</p>
      <ul>
        <li><b>Theme Sync</b>: Light Mode, Dark Mode, or System Sync</li>
        <li><b>Accent Themes</b>: Emerald Green, Teal, Sky Blue, Royal Violet</li>
        <li><b>LLM Selection</b>: Qwen 3.6 27B, GPT-OSS 120B, or GPT-OSS 20B</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🎨 Visual Color Palette & Accent Themes

EduAI features a Material Design 3 theme system synced across PostgreSQL user settings and local state:

| Accent Theme | Primary Color | Hex Code | Visual Preview |
| :--- | :--- | :--- | :---: |
| **Emerald** | `#10b981` | Green | `██████████` |
| **Teal** | `#14b8a6` | Deep Cyan | `██████████` |
| **Sky** | `#0ea5e9` | Vivid Blue | `██████████` |
| **Violet** | `#8b5cf6` | Royal Purple | `██████████` |

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TB
    subgraph Client ["Frontend (Next.js 16 App Router / Vercel)"]
        UI["React 19 Dashboard & Chat UI"]
        Query["TanStack React Query v5"]
        Theme["Material 3 Theme Context"]
    end

    subgraph AuthDB ["Authentication & State (Supabase)"]
        SupabaseAuth["Supabase Auth (JWT)"]
        Postgres["PostgreSQL Database (AsyncPG / SQLAlchemy)"]
    end

    subgraph Backend ["Backend API Engine (FastAPI / Render Docker)"]
        API["FastAPI REST & SSE Router"]
        JWTVerify["python-jose JWT Middleware"]
        Worker["FastAPI Background Task Worker"]
        RAG["RAG Service Engine"]
    end

    subgraph StorageVector ["Vector Cloud & S3"]
        S3["AWS S3 Bucket (Raw Files)"]
        Qdrant["Qdrant Cloud (3072-dim Vector DB)"]
    end

    subgraph AI ["AI Inference & Embedding Services"]
        Groq["Groq LPU API (Qwen 3.6 27B / GPT-OSS)"]
        Gemini["Google Gemini 2.0 Flash & Gemini Embedding"]
    end

    UI -->|JWT Auth Header| API
    UI <-->|Auth Tokens| SupabaseAuth
    UI <--> Theme
    API -->|Validate Token| JWTVerify
    API <-->|SQL Queries| Postgres
    API -->|Upload Document| Worker
    Worker -->|Upload PDF| S3
    Worker -->|Embed Batch| Gemini
    Worker -->|Upsert Points| Qdrant
    API -->|Query Vector Search| RAG
    RAG <-->|Retrieve Top Chunks| Qdrant
    RAG -->|Stream LLM Response| Groq
    Groq -.->|Fallback on Error| Gemini
    API -->|SSE Token Stream| UI
```

---

## 📊 RAG Ingestion Pipeline (Step-by-Step)

```text
 1. Document Upload
    └─► PDF / TXT / Image dropped into Chat Workspace
 2. Cloud Storage
    └─► File saved to AWS S3 (/documents/{user_id}/{chat_id}/{doc_id}/{filename})
 3. Async Background Worker (FastAPI BackgroundTasks)
    └─► PyMuPDF extracts text per page
    └─► LangChain RecursiveCharacterTextSplitter creates ~1000 char chunks
 4. Vector Embedding Generation
    └─► Batches of 50 text chunks embedded via Google `gemini-embedding-001` (3072 dims)
 5. Vector Indexing
    └─► PointStruct vectors upserted to Qdrant Cloud with metadata (`user_id`, `chat_id`, `document_id`)
 6. Retrieval & Answer Generation
    └─► User query vectorized ──► Qdrant Hybrid Search ──► Groq/Gemini SSE Streaming with Citation Cards
```

---

## 💻 Tech Stack & Architectural Decisions

| Component | Choice | Why This Technology? |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (React 19)** | App Router, Turbopack, and server components deliver lightning-fast initial load times. |
| **State Management** | **TanStack Query v5** | Provides seamless async state management, automatic query caching, and UI refetching. |
| **API Framework** | **FastAPI (Python 3.11)** | High-performance async Python framework with native OpenAPI schema generation. |
| **Database ORM** | **SQLAlchemy 2.0 + AsyncPG** | Pure asynchronous PostgreSQL database driver for non-blocking I/O operations. |
| **Vector Database** | **Qdrant Cloud** | High-performance vector similarity search with rich JSON payload metadata filtering. |
| **LLM Inference** | **Groq LPU & Gemini 2.0** | Ultra-low latency token generation with instant fallback redundancy for 100% uptime. |
| **Embedding Engine** | **Google Gemini Embedding** | 3072-dimensional cloud embeddings keeping RAM footprint under **150MB** for free cloud hosting. |
| **Cloud Infrastructure** | **Vercel & Render Docker** | Global CDN frontend hosting paired with containerized backend environment. |

---

## 📁 Repository Directory Structure

```text
c:/aidost/
├── frontend/                              # Next.js 16 React 19 Frontend
│   ├── src/
│   │   ├── app/                           # App Router Pages & Layouts
│   │   │   ├── dashboard/                 # Main Dashboard & Workspace Chat ([id])
│   │   │   ├── history/                   # Past Conversations History
│   │   │   ├── library/                   # Uploaded Document Library
│   │   │   ├── settings/                  # User Preferences & Theme Customizer
│   │   │   ├── login/                     # Authentication Login
│   │   │   ├── register/                  # Registration Flow
│   │   │   └── reset-password/            # Password Reset Flow
│   │   ├── components/                    # Component Architecture
│   │   │   ├── chat/                      # ChatInput, ChatMessage, NewChatModal
│   │   │   ├── dashboard/                 # DocumentUploadZone
│   │   │   ├── layout/                    # Sidebar (Collapsible M3 Navigation)
│   │   │   └── theme/                     # ThemeProvider & Accent Color Context
│   │   └── lib/                           # Supabase Client & Axios Configuration
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                               # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                           # REST & SSE Controllers (chats, documents, messages, settings)
│   │   ├── core/                          # AWS S3, Supabase Auth, Config, Qdrant, RAG Engine
│   │   ├── db/                            # Async Engine & async_sessionmaker Setup
│   │   ├── models/                        # SQLAlchemy Models (Chat, Message, Settings, User)
│   │   └── schemas/                       # Pydantic Schemas
│   ├── alembic/                           # Schema Migrations
│   ├── Dockerfile                         # Production Dockerfile
│   └── requirements.txt                   # Strictly Pinned Python Dependencies
│
└── README.md                              # EduAI Project Documentation
```

---

## ⚡ Quick Start & Local Setup Guide

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>1. Backend Setup (FastAPI)</h3>
      <pre><code>cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # Linux/Mac
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000</code></pre>
      <p><b>Server:</b> <code>http://localhost:8000</code><br /><b>API Docs:</b> <code>http://localhost:8000/docs</code></p>
    </td>
    <td width="50%" valign="top">
      <h3>2. Frontend Setup (Next.js)</h3>
      <pre><code>cd frontend
npm install
npm run dev</code></pre>
      <p><b>Web App:</b> <code>http://localhost:3000</code></p>
    </td>
  </tr>
</table>

---

## 🔑 Environment Variables Reference

<details>
<summary><b>View Frontend Environment Variables (<code>frontend/.env.local</code>)</b></summary>
<br />

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```
</details>

<details>
<summary><b>View Backend Environment Variables (<code>backend/.env</code>)</b></summary>
<br />

```env
# Database (Supabase PostgreSQL Connection URI)
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# Supabase Auth & JWT
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# AI Inference & Embeddings
GROQ_API_KEY="gsk_your_groq_key"
GEMINI_API_KEY="your_google_gemini_api_key"

# Vector Database (Qdrant Cloud)
QDRANT_URL="https://your-cluster.qdrant.tech:6333"
QDRANT_API_KEY="your_qdrant_api_key"

# Storage (AWS S3)
AWS_BUCKET_NAME="eduai-documents"
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="secret..."
```
</details>

---

## 📡 API Endpoint Reference

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server health check endpoint | ❌ |
| `GET` | `/api/v1/chats/` | List user chat sessions | 🔒 Yes |
| `POST` | `/api/v1/chats/` | Create a new chat session | 🔒 Yes |
| `DELETE` | `/api/v1/chats/{chat_id}` | Delete chat session & documents | 🔒 Yes |
| `GET` | `/api/v1/chats/{chat_id}/messages/` | Get chat message history | 🔒 Yes |
| `POST` | `/api/v1/chats/{chat_id}/messages/` | Stream AI response via SSE | 🔒 Yes |
| `POST` | `/api/v1/chats/{chat_id}/documents` | Upload PDF/Doc for RAG indexing | 🔒 Yes |
| `GET` | `/api/v1/documents/{doc_id}/status` | Poll background indexing job progress | 🔒 Yes |
| `GET` | `/api/v1/settings/` | Get user theme & LLM settings | 🔒 Yes |
| `PATCH` | `/api/v1/settings/` | Update theme, accent color, or model | 🔒 Yes |

---

## 🚢 Cloud Production Deployment

- **Backend (Render Docker Container)**: Built using `backend/Dockerfile`. Render runs database migrations (`alembic upgrade head`) and launches `uvicorn app.main:app` on container startup.
- **Frontend (Vercel)**: Deployed from `./frontend` directory. `NEXT_PUBLIC_API_URL` points to live Render backend (`https://aidost-backend.onrender.com`).

---

<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/andreasbm/readme-template/master/assets/star.gif" width="20" height="20" />
  <p><b>EduAI — Intelligent Learning Platform</b></p>
  <sub>Designed & Developed with ❤️ by <a href="https://github.com/Rakshit12902">Rakshit</a></sub>
</div>
