# מורה חכם (Smart Tutor)

AI-powered Bagrut exam tutoring application using Claude as the teaching engine. Built with a React + TypeScript frontend and FastAPI + SQLite backend.

## Architecture

```
tutor_app/
├── api/                  # FastAPI backend (routers, schemas, deps)
├── database/             # SQLite DB module (schema, migrations)
├── services/             # Business logic (auth, syllabus, pedagogy, evaluation, progress)
│   └── ai_core.py        # LLM singleton (Claude via LangChain)
├── tests/                # Pytest test suite (89 tests)
├── frontend/             # React + TypeScript + Tailwind CSS v4
│   ├── src/              # Components, hooks, stores, API layer
│   └── e2e/              # Playwright E2E tests (28 tests)
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## Tech Stack

**Backend:**
- Python 3.13 + FastAPI
- SQLite (8 tables: Users, Courses, Subjects, Topics, SubTopics, UserProgress, ChatSessions, LessonContent)
- JWT authentication (python-jose + bcrypt)
- LangChain + Anthropic Claude for AI features

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (navy + amber academic theme)
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

### Stopping the servers

Kill both servers when you want to restart or free the ports:

```bash
# Kill backend (port 8000)
lsof -ti:8000 | xargs kill

# Kill frontend (port 5173)
lsof -ti:5173 | xargs kill
```

Or simply press `Ctrl+C` in each terminal where the servers are running.

## Testing

**Backend tests (89 tests):**
```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

**Frontend E2E tests (28 tests):**
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
| POST | `/api/learning/i-do` | Get "I Do" lesson content (cached in DB) |
| POST | `/api/learning/we-do` | Send "We Do" chat message |
| POST | `/api/learning/you-do` | Send "You Do" chat message |
| DELETE | `/api/learning/chat/{subtopic_id}` | Clear chat history |
| GET | `/api/progress/dashboard` | Get progress dashboard |
| PUT | `/api/progress/{subtopic_id}` | Update progress |
| POST | `/api/evaluation/evaluate` | Evaluate student answer |
| GET | `/api/health` | Health check |

## Learning Flow

The app uses a 3-phase pedagogical model:

1. **I Do (אני מלמד)** — AI generates a lesson with explanations and solved examples. Lessons are cached in the DB per subtopic so the same content is reused on subsequent visits.
2. **We Do (נתרגל ביחד)** — Socratic dialogue where the AI guides through practice problems without giving answers directly.
3. **You Do (תרגול עצמאי)** — Multi-question independent practice. The AI auto-starts with a question; the student answers, sees an inline result card, then can request the next question or finish. Progress is saved only on finish.

Students can navigate back to a previous phase at any time. XP is awarded per question based on correctness and hints used (0 hints = 100 XP, 1 = 70, 2 = 40, 3+ = 10).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `JWT_SECRET` | No | JWT signing secret (defaults to dev secret) |
| `JWT_ALGORITHM` | No | JWT algorithm (default: HS256) |
| `JWT_EXPIRY_MINUTES` | No | Token expiry (default: 1440 = 24h) |

## License

MIT
