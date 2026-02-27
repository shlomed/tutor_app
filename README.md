# מורה חכם (Smart Tutor)

AI-powered Bagrut exam tutoring application using Claude as the teaching engine. Built with a React + TypeScript frontend and FastAPI + SQLite backend.

## Architecture

```
tutor_app/
├── api/                  # FastAPI backend (routers, schemas, deps)
├── database/             # SQLite DB module (schema, migrations)
├── services/             # Business logic (auth, syllabus, pedagogy, evaluation, progress)
│   └── ai_core.py        # LLM singleton (Claude via LangChain)
├── tests/                # Pytest test suite (86 tests)
├── frontend/             # React + TypeScript + Tailwind CSS v4
│   ├── src/              # Components, hooks, stores, API layer
│   └── e2e/              # Playwright E2E tests (27 tests)
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## Tech Stack

**Backend:**
- Python 3.13 + FastAPI
- SQLite (7 tables: Users, Courses, Subjects, Topics, SubTopics, UserProgress, ChatSessions)
- JWT authentication (python-jose + bcrypt)
- LangChain + Anthropic Claude for AI features

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (dark purple haze theme)
- Zustand (state management)
- react-markdown + KaTeX (math rendering)
- Playwright (E2E testing)

## Prerequisites

- Python 3.11+
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Clone and configure environment

```bash
git clone https://github.com/shlomed/tutor_app.git
cd tutor_app
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Python backend

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend

```bash
cd frontend
npm install
npx playwright install chromium   # For E2E tests
cd ..
```

## Running

Start both servers in separate terminals:

**Backend (port 8000):**
```bash
source .venv/bin/activate
python -m uvicorn api.main:app --reload --port 8000
```

**Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing

**Backend tests (86 tests):**
```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

**Frontend E2E tests (27 tests):**
```bash
cd frontend
npx playwright test
```

> E2E tests require both backend and frontend servers running (Playwright config auto-starts them if not already running).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/courses` | List user courses |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/{id}` | Rename course |
| DELETE | `/api/courses/{id}` | Delete course |
| POST | `/api/syllabus/parse` | Parse syllabus text via AI |
| POST | `/api/syllabus/save/{course_id}` | Save parsed syllabus |
| GET | `/api/syllabus/tree/{course_id}` | Get syllabus tree |
| GET | `/api/syllabus/flat/{course_id}` | Get flat syllabus rows |
| PUT | `/api/syllabus/subject/{id}` | Update subject name |
| PUT | `/api/syllabus/topic/{id}` | Update topic name |
| PUT | `/api/syllabus/subtopic/{id}` | Update subtopic name |
| POST | `/api/syllabus/reimport/{course_id}` | Re-import syllabus |
| POST | `/api/learning/ido` | Get "I Do" lesson content |
| POST | `/api/learning/wedo` | Send "We Do" chat message |
| POST | `/api/learning/youdo` | Send "You Do" chat message |
| DELETE | `/api/learning/chat/{subtopic_id}` | Clear chat history |
| GET | `/api/progress/dashboard` | Get progress dashboard |
| PUT | `/api/progress/{subtopic_id}` | Update progress |
| POST | `/api/evaluation/evaluate` | Evaluate student answer |
| GET | `/api/health` | Health check |

## Learning Flow

The app uses a 3-phase pedagogical model:

1. **I Do (אני מלמד)** — AI teaches the concept with explanations and examples
2. **We Do (נתרגל ביחד)** — Socratic dialogue where the AI guides without giving answers
3. **You Do (תרגול עצמאי)** — Independent practice with optional hints, then answer evaluation

XP is awarded based on correctness and number of hints used (0 hints = 100 XP, 1 = 70, 2 = 40, 3+ = 10).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `JWT_SECRET` | No | JWT signing secret (defaults to dev secret) |
| `JWT_ALGORITHM` | No | JWT algorithm (default: HS256) |
| `JWT_EXPIRY_MINUTES` | No | Token expiry (default: 1440 = 24h) |

## License

MIT
